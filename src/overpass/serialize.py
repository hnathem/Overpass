"""Turn domain objects into the JSON shapes the dashboard reads.

Shared by the live API and the static exporter so both speak exactly the same
language — the front-end can't tell which one it's talking to.
"""

from __future__ import annotations

from datetime import datetime

from .models import Contact, ContactRequest, GroundStation, Satellite, Unscheduled


def _iso(value: datetime) -> str:
    return value.isoformat()


def satellite_dict(satellite: Satellite) -> dict:
    return {"id": satellite.id, "name": satellite.name}


def station_dict(station: GroundStation) -> dict:
    return {
        "id": station.id,
        "name": station.name,
        "latitude": station.latitude,
        "longitude": station.longitude,
        "antennas": station.antennas,
        "status": station.status.value,
    }


def contact_dict(contact: Contact) -> dict:
    return {
        "request_id": contact.request_id,
        "satellite_id": contact.satellite_id,
        "station_id": contact.station_id,
        "antenna": contact.antenna,
        "start": _iso(contact.start),
        "end": _iso(contact.end),
        "priority": contact.priority.name.title(),
        "status": contact.status.value,
    }


def request_dicts(
    requests: list[ContactRequest],
    contacts: list[Contact],
    unscheduled: list[Unscheduled],
) -> list[dict]:
    """One row per request, noting whether it was scheduled (and where) or not."""
    contact_by_request = {contact.request_id: contact for contact in contacts}
    reason_by_request = {item.request_id: item.reason for item in unscheduled}

    rows = []
    for request in requests:
        contact = contact_by_request.get(request.id)
        rows.append(
            {
                "id": request.id,
                "satellite_id": request.satellite_id,
                "priority": request.priority.name.title(),
                "duration_min": round(request.duration.total_seconds() / 60, 1),
                "deadline": _iso(request.deadline) if request.deadline else None,
                "scheduled": contact is not None,
                "status": contact.status.value if contact else "unscheduled",
                "station_id": contact.station_id if contact else None,
                "start": _iso(contact.start) if contact else None,
                "reason": reason_by_request.get(request.id),
            }
        )
    return rows
