"""Overpass: schedule satellite-to-ground-station contacts without double-booking.

    from overpass import generate_scenario, build_schedule, summarize

    scenario = generate_scenario()
    result = build_schedule(scenario.stations, scenario.passes, scenario.requests)
    print(summarize(result, scenario.stations, scenario.hours))
"""

from .metrics import summarize
from .models import (
    Contact,
    ContactRequest,
    ContactStatus,
    GroundStation,
    PassWindow,
    Priority,
    Satellite,
    ScheduleResult,
    StationStatus,
    Unscheduled,
)
from .scheduler import build_schedule
from .simulate import Scenario, generate_scenario

__version__ = "0.1.0"

__all__ = [
    "Contact",
    "ContactRequest",
    "ContactStatus",
    "GroundStation",
    "PassWindow",
    "Priority",
    "Satellite",
    "Scenario",
    "ScheduleResult",
    "StationStatus",
    "Unscheduled",
    "build_schedule",
    "generate_scenario",
    "summarize",
]
