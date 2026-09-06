"""Load a scenario into the database, and create a default operator user.

Running this gives the API something to serve. It's safe to re-run: with
``reset=True`` (the default) it clears the fleet, stations, passes, and requests
and loads a fresh scenario, while leaving user accounts alone.
"""

from __future__ import annotations

from . import orm
from .db import get_session_factory, init_engine, to_iso
from .security import hash_password
from .simulate import Scenario, generate_scenario

# A demo login so the API is usable out of the box. Documented in the README;
# override it (and the JWT secret) for anything real.
DEFAULT_USERNAME = "operator"
DEFAULT_PASSWORD = "overpass"


def is_seeded(session) -> bool:
    """True if there is already fleet data loaded."""
    return session.query(orm.SatelliteRow).first() is not None


def seed_database(url: str | None = None, scenario: Scenario | None = None, reset: bool = True) -> Scenario:
    """Populate the database from a scenario. Returns the scenario used."""
    init_engine(url)
    scenario = scenario or generate_scenario()

    session_factory = get_session_factory()
    with session_factory() as session:
        if reset:
            session.query(orm.PassRow).delete()
            session.query(orm.RequestRow).delete()
            session.query(orm.StationRow).delete()
            session.query(orm.SatelliteRow).delete()
            session.flush()  # apply the deletes before re-inserting the same ids

        if session.query(orm.User).filter_by(username=DEFAULT_USERNAME).first() is None:
            session.add(orm.User(username=DEFAULT_USERNAME, password_hash=hash_password(DEFAULT_PASSWORD)))

        session.add_all(orm.SatelliteRow(id=s.id, name=s.name) for s in scenario.satellites)
        session.add_all(
            orm.StationRow(
                id=s.id,
                name=s.name,
                latitude=s.latitude,
                longitude=s.longitude,
                antennas=s.antennas,
                status=s.status.value,
            )
            for s in scenario.stations
        )
        session.add_all(
            orm.PassRow(
                satellite_id=p.satellite_id,
                station_id=p.station_id,
                start=to_iso(p.start),
                end=to_iso(p.end),
                max_elevation_deg=p.max_elevation_deg,
            )
            for p in scenario.passes
        )
        session.add_all(
            orm.RequestRow(
                id=r.id,
                satellite_id=r.satellite_id,
                duration_seconds=int(r.duration.total_seconds()),
                priority=r.priority.value,
                deadline=to_iso(r.deadline) if r.deadline else None,
            )
            for r in scenario.requests
        )
        session.commit()

    return scenario


def main(argv: list[str] | None = None) -> int:  # pragma: no cover - thin CLI
    scenario = seed_database()
    print(
        f"Seeded {len(scenario.satellites)} satellites, {len(scenario.stations)} stations, "
        f"{len(scenario.passes)} passes, {len(scenario.requests)} requests."
    )
    print(f"Default login: {DEFAULT_USERNAME} / {DEFAULT_PASSWORD}")
    return 0


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
