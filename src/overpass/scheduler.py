"""The contact scheduler — the heart of Overpass.

Given the pass windows (when each satellite can talk to each station) and a set
of contact requests, decide which requests get booked, onto which antenna, and
when — without ever double-booking an antenna.

**The strategy** is a greedy one, and it's worth stating plainly because it's
the whole idea:

1. Sort the requests by importance: highest priority first, then the tightest
   deadline, then id (so the result is stable and repeatable).
2. Walk that list and give each request the *earliest* pass window that still
   has a free antenna for the time it needs. Taking the earliest workable slot
   leaves later slots open for the requests still to come.

Greedy scheduling like this is fast and easy to reason about. It won't always
find the theoretically densest packing, but for prioritised work over scarce
antennas it produces a sensible, defensible plan — and, importantly, one a
human can look at and understand.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from .models import (
    Contact,
    ContactRequest,
    GroundStation,
    PassWindow,
    ScheduleResult,
    StationStatus,
    Unscheduled,
)

# Sorts requests without a deadline to the back, without special-casing None.
_NO_DEADLINE = datetime.max.replace(tzinfo=timezone.utc)


def _overlaps(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
    """True if two time intervals overlap at all (touching ends don't count)."""
    return a_start < b_end and b_start < a_end


def _free_antenna(
    reserved: dict[tuple[str, int], list[tuple[datetime, datetime]]],
    station_id: str,
    antenna_count: int,
    start: datetime,
    end: datetime,
) -> int | None:
    """Return the index of an antenna free for [start, end), or None if none is."""
    for antenna in range(antenna_count):
        booked = reserved[(station_id, antenna)]
        if all(not _overlaps(start, end, b_start, b_end) for b_start, b_end in booked):
            return antenna
    return None


def _place(
    request: ContactRequest,
    windows: list[PassWindow],
    stations: dict[str, GroundStation],
    reserved: dict[tuple[str, int], list[tuple[datetime, datetime]]],
) -> Contact | str:
    """Try to book one request. Return the Contact, or a reason it couldn't be.

    ``windows`` must be this satellite's pass windows over online stations,
    sorted earliest-first.
    """
    if not windows:
        return "no pass windows over an online station"

    any_long_enough = False
    deadline_blocked = False
    antenna_conflict = False

    for window in windows:
        # Book the contact at the front of the window for the time it needs.
        start = window.start
        end = start + request.duration

        if end > window.end:
            continue  # this pass is shorter than the requested contact
        any_long_enough = True

        # Windows are sorted by start, so the contact end only grows from here.
        # Once one finishes past the deadline, all later ones will too.
        if request.deadline is not None and end > request.deadline:
            deadline_blocked = True
            break

        antenna = _free_antenna(reserved, window.station_id, stations[window.station_id].antennas, start, end)
        if antenna is None:
            antenna_conflict = True
            continue  # every antenna here is busy during this pass

        reserved[(window.station_id, antenna)].append((start, end))
        return Contact(
            request_id=request.id,
            satellite_id=request.satellite_id,
            station_id=window.station_id,
            antenna=antenna,
            start=start,
            end=end,
            priority=request.priority,
        )

    if not any_long_enough:
        return "every pass window is shorter than the requested duration"
    if deadline_blocked and not antenna_conflict:
        return "no pass window completes before the deadline"
    if antenna_conflict:
        return "all antennas were busy during the usable pass windows"
    return "no usable pass window"


def build_schedule(
    stations: list[GroundStation],
    passes: list[PassWindow],
    requests: list[ContactRequest],
) -> ScheduleResult:
    """Book as many requests as possible onto free antennas, priority first.

    Returns the scheduled contacts (sorted by time) and the requests that could
    not be placed, each with a reason.
    """
    online = {station.id: station for station in stations if station.status is StationStatus.ONLINE}

    # Group each satellite's usable pass windows and sort them earliest-first
    # (breaking ties toward the higher, longer-lasting pass).
    windows_by_satellite: dict[str, list[PassWindow]] = defaultdict(list)
    for window in passes:
        if window.station_id in online:
            windows_by_satellite[window.satellite_id].append(window)
    for windows in windows_by_satellite.values():
        windows.sort(key=lambda w: (w.start, -w.max_elevation_deg))

    reserved: dict[tuple[str, int], list[tuple[datetime, datetime]]] = defaultdict(list)
    contacts: list[Contact] = []
    unscheduled: list[Unscheduled] = []

    ordered_requests = sorted(
        requests,
        key=lambda r: (-r.priority.value, r.deadline or _NO_DEADLINE, r.id),
    )

    for request in ordered_requests:
        outcome = _place(request, windows_by_satellite.get(request.satellite_id, []), online, reserved)
        if isinstance(outcome, Contact):
            contacts.append(outcome)
        else:
            unscheduled.append(Unscheduled(request_id=request.id, reason=outcome))

    contacts.sort(key=lambda c: (c.start, c.station_id, c.antenna))
    return ScheduleResult(contacts=contacts, unscheduled=unscheduled)
