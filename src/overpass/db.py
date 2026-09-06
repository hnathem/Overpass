"""Database engine and session setup (SQLAlchemy).

The backend is chosen by the ``DATABASE_URL`` environment variable. It defaults
to a local SQLite file so the app runs with zero setup; point it at Postgres
(see ``docker-compose.yml``) and nothing else changes — that's the reason to go
through an ORM rather than hand-written SQL per database.

Datetimes are stored as ISO-8601 strings. That keeps timezone-aware UTC intact
on both SQLite and Postgres, sidestepping the "SQLite forgets the timezone"
class of bugs.
"""

from __future__ import annotations

import os
from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DEFAULT_DATABASE_URL = "sqlite:///overpass.db"


class Base(DeclarativeBase):
    """The base class every ORM table inherits from."""


_engine: Engine | None = None
_session_factory: sessionmaker[Session] | None = None


def init_engine(url: str | None = None) -> Engine:
    """Create the engine and tables. Call once at startup (or per test run)."""
    global _engine, _session_factory

    resolved = url or os.environ.get("DATABASE_URL", DEFAULT_DATABASE_URL)
    # SQLite needs this to be used from more than one thread (the web server).
    connect_args = {"check_same_thread": False} if resolved.startswith("sqlite") else {}
    _engine = create_engine(resolved, connect_args=connect_args)

    # Import the models so they register on Base before we create the tables.
    # Done here (not at module top) to avoid an import cycle with orm.py.
    from . import orm  # noqa: F401

    Base.metadata.create_all(_engine)
    _session_factory = sessionmaker(bind=_engine, autoflush=False, expire_on_commit=False)
    return _engine


def get_session_factory() -> sessionmaker[Session]:
    """Return the session factory, initializing the engine on first use."""
    if _session_factory is None:
        init_engine()
    assert _session_factory is not None
    return _session_factory


def to_iso(value: datetime) -> str:
    """Serialize a datetime for storage."""
    return value.isoformat()


def from_iso(value: str) -> datetime:
    """Parse a stored datetime back into a timezone-aware datetime."""
    return datetime.fromisoformat(value)
