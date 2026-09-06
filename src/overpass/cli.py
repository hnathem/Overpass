"""A small command line for trying the scheduler.

    python -m overpass demo          # build a scenario, schedule it, print a summary

Handy for seeing the algorithm work end to end before any database or web UI is
involved.
"""

from __future__ import annotations

import argparse

from .metrics import summarize
from .scheduler import build_schedule
from .simulate import generate_scenario


def _run_demo(seed: int) -> None:
    scenario = generate_scenario(seed=seed)
    result = build_schedule(scenario.stations, scenario.passes, scenario.requests)
    metrics = summarize(result, scenario.stations, scenario.hours)

    print("Overpass — scheduling demo")
    print(
        f"  {len(scenario.satellites)} satellites, {len(scenario.stations)} stations, "
        f"{len(scenario.passes)} pass windows, {metrics['total_requests']} requests\n"
    )
    print(f"Scheduled {metrics['scheduled']} of {metrics['total_requests']} "
          f"({metrics['schedule_rate'] * 100:.0f}%); {metrics['unscheduled']} could not be placed.\n")

    print("Antenna utilization by station")
    for station in metrics["by_station"]:
        print(f"  {station['station_id']:<14} {station['utilization'] * 100:5.1f}%  "
              f"({station['booked_minutes']:.0f} min booked)")

    print("\nFirst few scheduled contacts")
    for contact in result.contacts[:5]:
        window = contact.start.strftime("%H:%M")
        print(f"  {window}  {contact.satellite_id} -> {contact.station_id} "
              f"(antenna {contact.antenna}, {contact.priority.name.lower()})")

    if result.unscheduled:
        print("\nWhy some requests were not placed")
        for item in result.unscheduled[:5]:
            print(f"  {item.request_id}: {item.reason}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="overpass", description="Satellite contact scheduler.")
    parser.add_argument("command", choices=["demo"], help="What to run.")
    parser.add_argument("--seed", type=int, default=7, help="Scenario seed (default: 7).")
    args = parser.parse_args(argv)

    if args.command == "demo":
        _run_demo(args.seed)
    return 0


if __name__ == "__main__":  # pragma: no cover - thin wrapper around main()
    raise SystemExit(main())
