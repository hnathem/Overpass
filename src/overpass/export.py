"""Export a scheduled scenario to static JSON for the dashboard.

The live API needs a running server and database; GitHub Pages has neither. This
writes the same data the API returns to a folder of JSON files, once, so the
front-end can be built as a fully static site. The scheduling still happens in
tested Python — this just captures its output.

    python -m overpass.export --out web/public/data
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
from pathlib import Path

from .metrics import summarize
from .outcomes import assign_statuses
from .scheduler import build_schedule
from .serialize import contact_dict, request_dicts, satellite_dict, station_dict
from .simulate import generate_scenario

_NOW_FRACTION = 0.4


def build_payload(seed: int = 7) -> dict:
    """Build every dataset the dashboard needs from a fresh scenario."""
    scenario = generate_scenario(seed=seed)
    result = build_schedule(scenario.stations, scenario.passes, scenario.requests)

    start = min(p.start for p in scenario.passes)
    end = max(p.end for p in scenario.passes)
    now = start + (end - start) * _NOW_FRACTION
    contacts = assign_statuses(result.contacts, now)

    return {
        "meta": {
            "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            "start": start.isoformat(),
            "end": end.isoformat(),
            "now": now.isoformat(),
            "satellites": len(scenario.satellites),
            "stations": len(scenario.stations),
            "passes": len(scenario.passes),
            "requests": len(scenario.requests),
        },
        "satellites": [satellite_dict(s) for s in scenario.satellites],
        "stations": [station_dict(s) for s in scenario.stations],
        "contacts": [contact_dict(c) for c in contacts],
        "requests": request_dicts(scenario.requests, contacts, result.unscheduled),
        "metrics": summarize(result, scenario.stations, scenario.hours),
    }


def export_all(out_dir: Path, seed: int = 7) -> list[str]:
    payload = build_payload(seed)
    out_dir.mkdir(parents=True, exist_ok=True)
    for name, data in payload.items():
        (out_dir / f"{name}.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    return list(payload)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="overpass.export", description="Export the schedule to static JSON."
    )
    parser.add_argument("--out", type=Path, default=Path("web/public/data"))
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args(argv)

    written = export_all(args.out, args.seed)
    print(f"Wrote {len(written)} files to {args.out}:")
    for name in written:
        print(f"  {name}.json")
    return 0


if __name__ == "__main__":  # pragma: no cover - thin wrapper around main()
    raise SystemExit(main())
