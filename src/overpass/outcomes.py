"""Fill in how scheduled contacts turned out.

The scheduler produces a plan; this decides what happened to each contact so the
dashboard has a realistic health view. Contacts before the "now" line are marked
completed, with the occasional failure; contacts after it stay scheduled. It's
seeded, so the picture is stable between runs.
"""

from __future__ import annotations

import random
from dataclasses import replace
from datetime import datetime

from .models import Contact, ContactStatus


def assign_statuses(
    contacts: list[Contact],
    now: datetime,
    seed: int = 11,
    failure_rate: float = 0.12,
) -> list[Contact]:
    """Return the contacts with a completed / failed / scheduled status set."""
    rng = random.Random(seed)
    decided: list[Contact] = []
    for contact in sorted(contacts, key=lambda c: (c.start, c.station_id, c.antenna)):
        if contact.start >= now:
            status = ContactStatus.SCHEDULED
        elif rng.random() < failure_rate:
            status = ContactStatus.FAILED
        else:
            status = ContactStatus.COMPLETED
        decided.append(replace(contact, status=status))
    return decided
