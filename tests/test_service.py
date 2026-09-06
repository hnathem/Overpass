"""Tests for the service layer (database -> schedule -> snapshot, and mutations)."""

from __future__ import annotations

from overpass.models import StationStatus
from overpass.service import build_snapshot, create_request, set_station_status


def test_snapshot_schedules_and_reconciles(session):
    snapshot = build_snapshot(session)

    assert len(snapshot.contacts) > 0
    assert snapshot.metrics["scheduled"] + snapshot.metrics["unscheduled"] == snapshot.metrics["total_requests"]
    assert snapshot.start <= snapshot.now <= snapshot.end
    for station in snapshot.metrics["by_station"]:
        assert 0.0 <= station["utilization"] <= 1.0


def test_create_request_adds_one(session):
    before = len(build_snapshot(session).requests)
    create_request(session, "LEO-001", duration_seconds=300, priority=4)
    assert len(build_snapshot(session).requests) == before + 1


def test_offline_station_drops_its_contacts(session):
    assert set_station_status(session, "GS-DUBLIN", StationStatus.OFFLINE)
    snapshot = build_snapshot(session)
    assert all(contact.station_id != "GS-DUBLIN" for contact in snapshot.contacts)


def test_set_status_unknown_station(session):
    assert set_station_status(session, "GS-NOWHERE", StationStatus.OFFLINE) is False
