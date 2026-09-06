"""Tests for the scheduling algorithm.

These build tiny, hand-made scenarios so each rule can be checked in isolation:
no double-booking, priority wins scarce slots, extra antennas allow concurrency,
offline stations and deadlines are respected.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from itertools import pairwise

from overpass.models import (
    ContactRequest,
    GroundStation,
    PassWindow,
    Priority,
    StationStatus,
)
from overpass.scheduler import build_schedule

BASE = datetime(2025, 1, 1, 10, 0, tzinfo=timezone.utc)


def at(minute: float) -> datetime:
    """A time `minute` minutes after the base instant."""
    return BASE + timedelta(minutes=minute)


def station(antennas: int = 1, status: StationStatus = StationStatus.ONLINE) -> GroundStation:
    return GroundStation("GS-1", "Test Station", 0.0, 0.0, antennas=antennas, status=status)


def window(start: float, end: float) -> PassWindow:
    return PassWindow("LEO-1", "GS-1", at(start), at(end), max_elevation_deg=45.0)


def request(request_id: str, minutes: float, priority=Priority.MEDIUM, deadline=None) -> ContactRequest:
    return ContactRequest(request_id, "LEO-1", timedelta(minutes=minutes), priority, deadline)


def _no_antenna_overlaps(contacts) -> bool:
    """True if no two contacts share an antenna at the same time."""
    by_antenna: dict[tuple[str, int], list[tuple[datetime, datetime]]] = defaultdict(list)
    for contact in contacts:
        by_antenna[(contact.station_id, contact.antenna)].append((contact.start, contact.end))
    for intervals in by_antenna.values():
        intervals.sort()
        for (_, prev_end), (next_start, _) in pairwise(intervals):
            if next_start < prev_end:
                return False
    return True


def test_places_a_single_request():
    result = build_schedule([station()], [window(0, 10)], [request("REQ-1", 6)])
    assert len(result.contacts) == 1
    assert result.contacts[0].request_id == "REQ-1"
    assert result.unscheduled == []


def test_never_double_books_one_antenna():
    # One antenna, one 10-minute window; two 6-minute requests can't both fit.
    result = build_schedule(
        [station(antennas=1)],
        [window(0, 10)],
        [request("REQ-1", 6), request("REQ-2", 6)],
    )
    assert len(result.contacts) == 1
    assert len(result.unscheduled) == 1
    assert _no_antenna_overlaps(result.contacts)


def test_priority_wins_a_scarce_window():
    # Only room for one; the critical request should take it over the low one.
    result = build_schedule(
        [station(antennas=1)],
        [window(0, 10)],
        [request("REQ-low", 6, Priority.LOW), request("REQ-crit", 6, Priority.CRITICAL)],
    )
    assert [c.request_id for c in result.contacts] == ["REQ-crit"]
    assert result.unscheduled[0].request_id == "REQ-low"


def test_extra_antenna_allows_two_at_once():
    # Two antennas means two concurrent contacts in the same window.
    result = build_schedule(
        [station(antennas=2)],
        [window(0, 10)],
        [request("REQ-1", 6), request("REQ-2", 6)],
    )
    assert len(result.contacts) == 2
    assert {c.antenna for c in result.contacts} == {0, 1}
    assert _no_antenna_overlaps(result.contacts)


def test_offline_station_is_skipped():
    result = build_schedule(
        [station(status=StationStatus.OFFLINE)],
        [window(0, 10)],
        [request("REQ-1", 6)],
    )
    assert result.contacts == []
    assert "online" in result.unscheduled[0].reason


def test_deadline_is_respected():
    # The only window ends the contact at 10:06, past a 10:03 deadline.
    result = build_schedule(
        [station()],
        [window(0, 10)],
        [request("REQ-1", 6, deadline=at(3))],
    )
    assert result.contacts == []
    assert "deadline" in result.unscheduled[0].reason


def test_window_shorter_than_request():
    result = build_schedule([station()], [window(0, 4)], [request("REQ-1", 6)])
    assert result.contacts == []
    assert "shorter" in result.unscheduled[0].reason
