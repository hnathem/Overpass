"""Tests for the scenario generator and the end-to-end invariants."""

from __future__ import annotations

from collections import defaultdict
from itertools import pairwise

from overpass import build_schedule, generate_scenario, summarize


def test_scenario_has_the_expected_shape():
    scenario = generate_scenario()
    assert len(scenario.satellites) == 10
    assert len(scenario.stations) == 6
    assert len(scenario.requests) == 120
    assert len(scenario.passes) > 0


def test_scenario_is_reproducible():
    # The same seed must produce an identical scenario.
    assert generate_scenario(seed=7) == generate_scenario(seed=7)


def test_end_to_end_never_double_books():
    scenario = generate_scenario()
    result = build_schedule(scenario.stations, scenario.passes, scenario.requests)

    # Every request is accounted for exactly once.
    assert len(result.contacts) + len(result.unscheduled) == len(scenario.requests)

    # No antenna is ever booked twice at the same time.
    by_antenna: dict[tuple[str, int], list] = defaultdict(list)
    for contact in result.contacts:
        by_antenna[(contact.station_id, contact.antenna)].append((contact.start, contact.end))
    for intervals in by_antenna.values():
        intervals.sort()
        for (_, prev_end), (next_start, _) in pairwise(intervals):
            assert next_start >= prev_end


def test_every_contact_fits_inside_a_real_pass():
    scenario = generate_scenario()
    result = build_schedule(scenario.stations, scenario.passes, scenario.requests)

    passes = {
        (p.satellite_id, p.station_id): [] for p in scenario.passes
    }
    for p in scenario.passes:
        passes[(p.satellite_id, p.station_id)].append((p.start, p.end))

    for contact in result.contacts:
        windows = passes[(contact.satellite_id, contact.station_id)]
        assert any(start <= contact.start and contact.end <= end for start, end in windows)


def test_summary_totals_line_up():
    scenario = generate_scenario()
    result = build_schedule(scenario.stations, scenario.passes, scenario.requests)
    metrics = summarize(result, scenario.stations, scenario.hours)

    assert metrics["scheduled"] + metrics["unscheduled"] == metrics["total_requests"]
    for station in metrics["by_station"]:
        assert 0.0 <= station["utilization"] <= 1.0
