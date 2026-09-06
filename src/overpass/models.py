"""The domain model for Overpass.

These are small, plain data types that describe the world the scheduler reasons
about: satellites, ground stations, the short windows when they can talk (pass
windows), the requests to make contact, and the scheduled contacts that come
out the other end. Keeping them free of any scheduling logic lets the algorithm
in ``scheduler.py`` stay the interesting part.

All times are timezone-aware UTC. Working in one timezone everywhere avoids a
whole category of "off by a few hours" bugs.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum


class Priority(Enum):
    """How important a contact is. Higher value wins when passes collide."""

    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


class StationStatus(str, Enum):
    """Whether a ground station can currently be used."""

    ONLINE = "online"
    OFFLINE = "offline"


class ContactStatus(str, Enum):
    """Where a scheduled contact is in its lifecycle."""

    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass(frozen=True)
class Satellite:
    """One satellite in the fleet, e.g. LEO-042."""

    id: str
    name: str


@dataclass(frozen=True)
class GroundStation:
    """A ground station (a site with one or more antennas).

    ``antennas`` is how many contacts the station can hold at once — each
    antenna can talk to one satellite at a time.
    """

    id: str
    name: str
    latitude: float
    longitude: float
    antennas: int = 1
    status: StationStatus = StationStatus.ONLINE


@dataclass(frozen=True)
class PassWindow:
    """The stretch of time a satellite is overhead a station and can talk.

    ``max_elevation_deg`` is how high the satellite gets in the sky during the
    pass (higher is a better, longer-lasting link) — useful for ranking passes.
    """

    satellite_id: str
    station_id: str
    start: datetime
    end: datetime
    max_elevation_deg: float

    @property
    def duration(self) -> timedelta:
        return self.end - self.start


@dataclass(frozen=True)
class ContactRequest:
    """A request to talk to a satellite for a given length of time.

    The scheduler will try to place it in a pass window before ``deadline``
    (if one is given), preferring higher priority requests when they compete.
    """

    id: str
    satellite_id: str
    duration: timedelta
    priority: Priority
    deadline: datetime | None = None


@dataclass(frozen=True)
class Contact:
    """A scheduled contact: a request placed on a specific antenna and time."""

    request_id: str
    satellite_id: str
    station_id: str
    antenna: int
    start: datetime
    end: datetime
    priority: Priority
    status: ContactStatus = ContactStatus.SCHEDULED


@dataclass(frozen=True)
class Unscheduled:
    """A request that couldn't be placed, with a plain-English reason."""

    request_id: str
    reason: str


@dataclass(frozen=True)
class ScheduleResult:
    """The output of a scheduling run: what got booked and what didn't."""

    contacts: list[Contact]
    unscheduled: list[Unscheduled]
