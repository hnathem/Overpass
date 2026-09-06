# Overpass

**Schedule satellite-to-ground-station contacts without double-booking an antenna.**

A satellite in low orbit is only overhead a given ground station for a few
minutes at a time, and a station's antenna can talk to one satellite at a time.
When those short windows overlap, something has to decide which contact gets the
antenna and which one waits for a later pass. Overpass makes that decision: it
takes the predicted pass windows and a queue of contact requests, resolves the
conflicts by priority, and produces a clean, conflict-free plan — plus a view of
how busy each station is and how the schedule is performing.

Everything runs on a synthetic scenario. No real satellite, station, or customer
data is used.

## The idea in one picture

```
requests (who needs to talk, how long, how urgent)
        +                                   priority-first
pass windows (when each satellite   ->      allocation onto free    ->   a conflict-free
can reach each station)                     antennas                     schedule + the
        +                                                                requests that
ground stations (antennas, online/offline)                              didn't fit, and why
```

## How the scheduler works

The core is a priority-first algorithm, and the whole idea fits in two steps:

1. **Sort requests by importance** — highest priority first, then the tightest
   deadline, then id (so the result is stable and repeatable).
2. **Give each request the earliest pass window that still has a free antenna**
   for the time it needs. Taking the soonest workable slot leaves later slots
   open for the requests still to come.

An antenna is never double-booked: each station has one or more antennas, and a
contact is only placed on an antenna that is free for its whole duration. A
request that can't be placed is reported with a plain reason — the window was
too short, every antenna was busy, or it couldn't finish before its deadline.
Taking the earliest workable slot won't always find the densest possible
packing, but for prioritized work over scarce antennas it produces a sensible,
explainable plan.

See [`scheduler.py`](src/overpass/scheduler.py) for the algorithm and
[`models.py`](src/overpass/models.py) for the domain it works on.

## Quick start

```bash
make install     # install the package and dev tools (pytest, ruff)
make demo        # build a scenario, schedule it, and print a summary
make test        # run the test suite
```

`make demo` prints something like:

```
Scheduled 93 of 120 (78%); 27 could not be placed.

Antenna utilization by station
  GS-REDMOND        4.5%  (131 min booked)
  ...
```

## The API and database

The schedule is served by a FastAPI app backed by a database (SQLAlchemy). It
defaults to a local SQLite file, so there's nothing to install:

```bash
make seed        # load a scenario and create the default operator user
make api         # http://127.0.0.1:8000  (interactive docs at /docs)
```

Reads are open so the dashboard can be explored freely; the two actions that
change the plan require a token. Log in with the demo account (`operator` /
`overpass`), then call the protected endpoints with the returned bearer token.

| Endpoint | Auth | Returns / does |
|----------|------|----------------|
| `POST /auth/token` | — | Log in, get a JWT |
| `GET /api/meta` | — | Time span, the "now" line, and counts |
| `GET /api/satellites` · `/api/stations` | — | The fleet and the ground network |
| `GET /api/contacts` | — | The scheduled contacts, with outcomes |
| `GET /api/requests` | — | Every request: scheduled (where) or not (why) |
| `GET /api/metrics` | — | Schedule rate and per-station utilization |
| `POST /api/requests` | ✔ | Add a contact request |
| `POST /api/stations/{id}/status` | ✔ | Take a station on- or offline |

Adding a request or taking a station offline changes what the scheduler returns
on the next read — that's the resilience story (a downed station's work is
reassigned to other passes).

To run against **PostgreSQL** instead, start it with Docker and point the app at
it — nothing else changes:

```bash
docker compose up -d
export DATABASE_URL=postgresql+psycopg2://overpass:overpass@localhost:5432/overpass
make seed && make api
```

## What's here so far

| Stage | Status |
|-------|--------|
| Domain model + scheduling algorithm (Python) | ✅ done |
| Scenario simulator + metrics | ✅ done |
| FastAPI service + PostgreSQL + JWT auth | ✅ done |
| Next.js mission-control dashboard | ⏳ next |
| CI + GitHub Pages deploy + docs | ⏳ next |

## Repository layout

```
overpass/
├── src/overpass/
│   ├── models.py       # domain types: satellites, stations, passes, contacts
│   ├── scheduler.py    # the priority-first scheduling algorithm
│   ├── simulate.py     # generate a synthetic scenario to schedule
│   ├── metrics.py      # summary metrics (utilization, schedule rate)
│   ├── outcomes.py     # fill in completed / failed / scheduled around "now"
│   ├── db.py, orm.py   # SQLAlchemy engine and tables
│   ├── security.py     # password hashing + JWT tokens
│   ├── seed.py         # load a scenario + default user into the database
│   ├── service.py      # database -> schedule snapshot, and the mutations
│   ├── serialize.py    # shared JSON shapes for the API and the export
│   ├── api.py          # the FastAPI application
│   ├── export.py       # write the schedule to static JSON for the dashboard
│   └── cli.py          # a small `overpass demo` command
├── docker-compose.yml  # PostgreSQL, for running production-like
└── tests/              # scheduler, service, API, and export tests
```

## License

[MIT](LICENSE).
