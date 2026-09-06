"""Summary metrics for a schedule.

These are the numbers an operator watches: how much of the request queue got
booked, how busy each station's antennas are, and the mix of contact statuses.
Kept separate from the scheduler so the algorithm stays focused on placing
contacts, not measuring itself.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime

from .models import GroundStation, ScheduleResult


def _minutes(start: datetime, end: datetime) -> float:
    return (end - start).total_seconds() / 60


def summarize(result: ScheduleResult, stations: list[GroundStation], hours: int) -> dict:
    """Roll a schedule up into headline metrics.

    Utilization is booked antenna-time divided by the antenna-time available
    over the horizon (a station with 2 antennas over 24h has 2,880 minutes).
    """
    horizon_minutes = hours * 60

    booked: dict[str, float] = defaultdict(float)
    for contact in result.contacts:
        booked[contact.station_id] += _minutes(contact.start, contact.end)

    by_station = []
    for station in sorted(stations, key=lambda s: s.id):
        capacity = station.antennas * horizon_minutes
        used = booked.get(station.id, 0.0)
        by_station.append(
            {
                "station_id": station.id,
                "name": station.name,
                "antennas": station.antennas,
                "booked_minutes": round(used, 1),
                "utilization": round(used / capacity, 4) if capacity else 0.0,
            }
        )

    status_counts: dict[str, int] = defaultdict(int)
    for contact in result.contacts:
        status_counts[contact.status.value] += 1

    total = len(result.contacts) + len(result.unscheduled)
    return {
        "total_requests": total,
        "scheduled": len(result.contacts),
        "unscheduled": len(result.unscheduled),
        "schedule_rate": round(len(result.contacts) / total, 4) if total else 0.0,
        "by_status": dict(status_counts),
        "by_station": by_station,
    }
