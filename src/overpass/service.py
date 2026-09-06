"""The application service layer.

This is the seam between the database and everything above it (the API, the
exporter). It reads the stored requests, passes, and stations, hands them to the
scheduler, fills in contact outcomes, and returns a single tidy snapshot. It
also holds the two mutations that change the plan: adding a request and taking a
station on- or offline.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import orm
from .db import from_iso
from .metrics import summarize
from .models import (
    Contact,
    ContactRequest,
    GroundStation,
    PassWindow,
    Priority,
    ScheduleResult,
    StationStatus,
)
from .outcomes import assign_statuses
from .scheduler import build_schedule

# The "now" line sits part-way through the horizon, so there's a mix of finished
# and upcoming contacts to show.
_NOW_FRACTION = 0.4


@dataclass(frozen=True)
class Snapshot:
    """Everything the API needs for one view of the world."""

    stations: list[GroundStation]
    requests: list[ContactRequest]
    result: ScheduleResult
    contacts: list[Contact]  # scheduled contacts, with outcomes filled in
    metrics: dict
    start: datetime | None
    end: datetime | None
    now: datetime | None


def load_stations(session: Session) -> list[GroundStation]:
    return [
        GroundStation(
            id=row.id,
            name=row.name,
            latitude=row.latitude,
            longitude=row.longitude,
            antennas=row.antennas,
            status=StationStatus(row.status),
        )
        for row in session.query(orm.StationRow).all()
    ]


def load_passes(session: Session) -> list[PassWindow]:
    return [
        PassWindow(
            satellite_id=row.satellite_id,
            station_id=row.station_id,
            start=from_iso(row.start),
            end=from_iso(row.end),
            max_elevation_deg=row.max_elevation_deg,
        )
        for row in session.query(orm.PassRow).all()
    ]


def load_requests(session: Session) -> list[ContactRequest]:
    return [
        ContactRequest(
            id=row.id,
            satellite_id=row.satellite_id,
            duration=timedelta(seconds=row.duration_seconds),
            priority=Priority(row.priority),
            deadline=from_iso(row.deadline) if row.deadline else None,
        )
        for row in session.query(orm.RequestRow).all()
    ]


def build_snapshot(session: Session) -> Snapshot:
    """Read the current data, schedule it, and return a full snapshot."""
    stations = load_stations(session)
    passes = load_passes(session)
    requests = load_requests(session)

    result = build_schedule(stations, passes, requests)

    if passes:
        start = min(p.start for p in passes)
        end = max(p.end for p in passes)
        now = start + (end - start) * _NOW_FRACTION
        hours = max(1, math.ceil((end - start).total_seconds() / 3600))
        contacts = assign_statuses(result.contacts, now)
    else:
        start = end = now = None
        hours = 24
        contacts = result.contacts

    metrics = summarize(result, stations, hours)
    return Snapshot(
        stations=stations,
        requests=requests,
        result=result,
        contacts=contacts,
        metrics=metrics,
        start=start,
        end=end,
        now=now,
    )


def _next_request_id(session: Session) -> str:
    """The next REQ-NNN id, one past the current highest."""
    ids = session.execute(select(orm.RequestRow.id)).scalars().all()
    highest = 0
    for request_id in ids:
        try:
            highest = max(highest, int(request_id.split("-")[1]))
        except (IndexError, ValueError):
            continue
    return f"REQ-{highest + 1:03d}"


def create_request(
    session: Session,
    satellite_id: str,
    duration_seconds: int,
    priority: int,
    deadline: str | None = None,
) -> orm.RequestRow:
    """Add a contact request. The next schedule read will account for it."""
    row = orm.RequestRow(
        id=_next_request_id(session),
        satellite_id=satellite_id,
        duration_seconds=duration_seconds,
        priority=priority,
        deadline=deadline,
    )
    session.add(row)
    session.commit()
    return row


def set_station_status(session: Session, station_id: str, status: StationStatus) -> bool:
    """Take a station on- or offline. Returns False if the station is unknown."""
    row = session.get(orm.StationRow, station_id)
    if row is None:
        return False
    row.status = status.value
    session.commit()
    return True
