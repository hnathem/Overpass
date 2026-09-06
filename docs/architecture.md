# Architecture

Overpass is a small system with a clear seam between layers. The scheduling
logic is pure Python and knows nothing about the web or the database; the
database and API sit around it; the dashboard sits on top.

```
  simulate.py ─┐
  (scenario)   │
               ▼
  seed.py ─► database ─► service.py ─► scheduler.py ─► ScheduleResult
  (load)     (SQLAlchemy)  (snapshot)   (priority-first   │
                              │          allocation)       │
                              ▼                             ▼
                        outcomes.py                   metrics.py
                        (completed/failed)            (utilization)
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
        api.py (FastAPI, JWT)          export.py (static JSON)
              │                               │
              ▼                               ▼
        live clients                   web/ (Next.js dashboard)
```

## The layers

- **Domain + scheduler** (`models.py`, `scheduler.py`) — pure logic. Given
  stations, pass windows, and requests, it returns a conflict-free schedule.
  No database, no web, so it's trivial to test in isolation.
- **Persistence** (`db.py`, `orm.py`, `seed.py`) — SQLAlchemy over SQLite or
  Postgres. Stores the inputs (fleet, stations, passes, requests) and the users.
- **Service** (`service.py`) — the seam. Reads the database, runs the scheduler,
  fills in contact outcomes, and returns one snapshot. Also holds the two
  mutations (add a request, take a station offline).
- **API** (`api.py`) — a thin FastAPI layer over the service, with JWT auth on
  the actions that change the plan.
- **Export** (`export.py`) — writes the same data as static JSON so the
  dashboard can be hosted without a server.
- **Dashboard** (`web/`) — a Next.js app that reads that JSON.

## Why contacts aren't stored

Scheduled contacts are *derived*, not persisted. They're recomputed from the
current requests, passes, and station states every time they're read. That means
they're always consistent with the data — add a request or take a station
offline, and the next read reflects it, with no cache to invalidate.
