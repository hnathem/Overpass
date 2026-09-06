# Data model

The database stores the *inputs* to scheduling — the fleet, the ground network,
the pass windows, and the request queue — plus the user accounts. Scheduled
contacts are computed on demand (see [architecture](architecture.md)), so there
is no contacts table.

```mermaid
erDiagram
    SATELLITES ||--o{ PASS_WINDOWS : "seen in"
    STATIONS ||--o{ PASS_WINDOWS : "hosts"
    SATELLITES ||--o{ CONTACT_REQUESTS : "requested for"

    USERS {
        int id PK
        string username
        string password_hash
    }
    SATELLITES {
        string id PK
        string name
    }
    STATIONS {
        string id PK
        string name
        float latitude
        float longitude
        int antennas
        string status
    }
    PASS_WINDOWS {
        int id PK
        string satellite_id FK
        string station_id FK
        string start
        string end
        float max_elevation_deg
    }
    CONTACT_REQUESTS {
        string id PK
        string satellite_id FK
        int duration_seconds
        int priority
        string deadline
    }
```

Notes:

- **Times** are stored as ISO-8601 strings so timezone-aware UTC survives on
  both SQLite and Postgres.
- **Priority** is a small integer (1 = low … 4 = critical).
- **Station status** is `online` or `offline`; offline stations are skipped by
  the scheduler, and their work is reassigned to other passes.
