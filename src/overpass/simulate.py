"""Generate a synthetic scenario to schedule.

This stands in for the real feeds an operator would have: the fleet, the ground
stations, the predicted pass windows, and the queue of contact requests. The
pass times are a simple simulation — evenly spread passes with some jitter, not
real orbital mechanics — which is plenty to exercise the scheduler and to make
a lively timeline. Everything is seeded, so the same seed always produces the
same scenario (handy for tests and for a stable demo).

No real satellite, station, or customer data is used.
"""

from __future__ import annotations

import random
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from .models import (
    ContactRequest,
    GroundStation,
    PassWindow,
    Priority,
    Satellite,
)

# A default epoch so scenarios are reproducible unless a start is passed in.
DEFAULT_START = datetime(2025, 1, 1, 0, 0, tzinfo=timezone.utc)

# The ground network. Real cities for a believable world map — including the
# two sites named in the role (Redmond and Northridge). Coordinates are
# approximate and only used for the map.
_STATIONS: tuple[tuple[str, str, float, float, int], ...] = (
    ("GS-REDMOND", "Redmond, WA", 47.67, -122.12, 2),
    ("GS-NORTHRIDGE", "Northridge, CA", 34.24, -118.53, 1),
    ("GS-ASHBURN", "Ashburn, VA", 39.04, -77.49, 2),
    ("GS-DUBLIN", "Dublin, IE", 53.35, -6.26, 1),
    ("GS-SINGAPORE", "Singapore", 1.35, 103.82, 1),
    ("GS-SAOPAULO", "São Paulo, BR", -23.55, -46.63, 1),
)

_SATELLITE_COUNT = 10
_PRIORITY_WEIGHTS = {Priority.LOW: 0.4, Priority.MEDIUM: 0.3, Priority.HIGH: 0.2, Priority.CRITICAL: 0.1}


@dataclass(frozen=True)
class Scenario:
    """A complete, self-contained problem for the scheduler to solve."""

    start: datetime
    hours: int
    satellites: list[Satellite]
    stations: list[GroundStation]
    passes: list[PassWindow]
    requests: list[ContactRequest]


def _build_stations() -> list[GroundStation]:
    return [
        GroundStation(id=code, name=name, latitude=lat, longitude=lon, antennas=antennas)
        for code, name, lat, lon, antennas in _STATIONS
    ]


def _build_satellites() -> list[Satellite]:
    return [Satellite(id=f"LEO-{n:03d}", name=f"Leo {n:03d}") for n in range(1, _SATELLITE_COUNT + 1)]


def _build_passes(
    rng: random.Random,
    satellites: list[Satellite],
    stations: list[GroundStation],
    start: datetime,
    hours: int,
) -> list[PassWindow]:
    """A handful of passes for each satellite over each station, spread out."""
    horizon = hours * 60  # minutes
    passes: list[PassWindow] = []
    for satellite in satellites:
        for station in stations:
            # A given station sees a given satellite only a few times a day.
            count = rng.randint(3, 6)
            spacing = horizon / count
            for index in range(count):
                # Even spacing plus jitter, so passes don't line up artificially.
                offset = spacing * index + rng.uniform(0, spacing * 0.6)
                begin = start + timedelta(minutes=offset)
                length = rng.uniform(4, 9)  # minutes overhead
                if offset + length > horizon:
                    continue
                passes.append(
                    PassWindow(
                        satellite_id=satellite.id,
                        station_id=station.id,
                        start=begin,
                        end=begin + timedelta(minutes=length),
                        max_elevation_deg=round(rng.uniform(15, 85), 1),
                    )
                )
    return passes


def _build_requests(
    rng: random.Random,
    satellites: list[Satellite],
    start: datetime,
    hours: int,
    count: int,
) -> list[ContactRequest]:
    """A queue of contact requests, with mixed priorities and some deadlines."""
    priorities = list(_PRIORITY_WEIGHTS)
    weights = list(_PRIORITY_WEIGHTS.values())

    # Demand is uneven: a few satellites are in high demand while the rest are
    # quiet. That, plus tight deadlines, creates real competition for the early
    # passes — which is what makes the scheduler's priority calls matter.
    satellite_weights = [3 if index < 5 else 1 for index in range(len(satellites))]

    requests: list[ContactRequest] = []
    for number in range(1, count + 1):
        has_deadline = rng.random() < 0.7
        deadline = (
            start + timedelta(hours=rng.uniform(hours * 0.1, hours * 0.5)) if has_deadline else None
        )
        requests.append(
            ContactRequest(
                id=f"REQ-{number:03d}",
                satellite_id=rng.choices(satellites, weights=satellite_weights)[0].id,
                duration=timedelta(minutes=rng.randint(3, 8)),
                priority=rng.choices(priorities, weights=weights)[0],
                deadline=deadline,
            )
        )
    return requests


def generate_scenario(
    seed: int = 7,
    start: datetime = DEFAULT_START,
    hours: int = 24,
    request_count: int = 120,
) -> Scenario:
    """Build a full scenario: fleet, stations, pass windows, and requests."""
    rng = random.Random(seed)
    satellites = _build_satellites()
    stations = _build_stations()
    passes = _build_passes(rng, satellites, stations, start, hours)
    requests = _build_requests(rng, satellites, start, hours, request_count)
    return Scenario(
        start=start,
        hours=hours,
        satellites=satellites,
        stations=stations,
        passes=passes,
        requests=requests,
    )
