"""The database tables, as SQLAlchemy ORM models.

These mirror the domain types in ``models.py`` but hold storable primitives:
durations as seconds, priorities as small integers, datetimes as ISO strings.
Foreign keys tie pass windows and requests back to their satellite and station,
so the database enforces that they reference things that exist.

Scheduled contacts are deliberately *not* stored: they're derived on demand
from the requests, passes, and station states, so they're always consistent
with the current data.
"""

from __future__ import annotations

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)


class SatelliteRow(Base):
    __tablename__ = "satellites"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)


class StationRow(Base):
    __tablename__ = "stations"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    antennas: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(String, default="online")


class PassRow(Base):
    __tablename__ = "pass_windows"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    satellite_id: Mapped[str] = mapped_column(ForeignKey("satellites.id"), index=True)
    station_id: Mapped[str] = mapped_column(ForeignKey("stations.id"), index=True)
    start: Mapped[str] = mapped_column(String)  # ISO-8601 UTC
    end: Mapped[str] = mapped_column(String)
    max_elevation_deg: Mapped[float] = mapped_column(Float)


class RequestRow(Base):
    __tablename__ = "contact_requests"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    satellite_id: Mapped[str] = mapped_column(ForeignKey("satellites.id"), index=True)
    duration_seconds: Mapped[int] = mapped_column(Integer)
    priority: Mapped[int] = mapped_column(Integer)  # 1=low .. 4=critical
    deadline: Mapped[str | None] = mapped_column(String, nullable=True)  # ISO or null
