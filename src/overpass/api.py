"""The Overpass HTTP API (FastAPI).

Endpoints for the fleet, stations, the computed schedule, requests, and metrics,
plus JWT-protected mutations: add a contact request, or take a station on/offline
(both change what the scheduler returns on the next read). Reads are open so the
dashboard can be explored freely; writes require a token.

Run it with:

    uvicorn overpass.api:app --reload      # http://127.0.0.1:8000/docs
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from . import orm, service
from .db import get_session_factory, init_engine
from .models import StationStatus
from .security import create_access_token, decode_access_token, verify_password
from .seed import is_seeded, seed_database
from .serialize import contact_dict, request_dicts, station_dict

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Make sure the database exists, and seed it the first time so the API has
    # something to serve out of the box.
    init_engine()
    session_factory = get_session_factory()
    with session_factory() as session:
        empty = not is_seeded(session)
    if empty:
        seed_database()
    yield


def get_db():
    """Yield a database session per request, closing it afterwards."""
    session_factory = get_session_factory()
    with session_factory() as session:
        yield session


def current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> str:
    """Resolve the caller from their token, or reject the request."""
    username = decode_access_token(token)
    if username is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    if db.query(orm.User).filter_by(username=username).first() is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unknown user")
    return username


class NewRequest(BaseModel):
    satellite_id: str
    duration_minutes: int = Field(ge=1, le=30)
    priority: int = Field(ge=1, le=4, description="1=low, 2=medium, 3=high, 4=critical")
    deadline: str | None = None  # ISO-8601, optional


class StationStatusUpdate(BaseModel):
    status: StationStatus


def create_app() -> FastAPI:
    app = FastAPI(
        title="Overpass API",
        version="0.1.0",
        description="Schedules satellite-to-ground-station contacts without double-booking.",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
    )

    @app.get("/health", tags=["meta"])
    def health() -> dict:
        return {"status": "ok"}

    @app.post("/auth/token", tags=["auth"])
    def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: Annotated[Session, Depends(get_db)]) -> dict:
        user = db.query(orm.User).filter_by(username=form.username).first()
        if user is None or not verify_password(form.password, user.password_hash):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect username or password")
        return {"access_token": create_access_token(user.username), "token_type": "bearer"}

    @app.get("/auth/me", tags=["auth"])
    def me(username: Annotated[str, Depends(current_user)]) -> dict:
        return {"username": username}

    @app.get("/api/meta", tags=["data"])
    def meta(db: Annotated[Session, Depends(get_db)]) -> dict:
        snapshot = service.build_snapshot(db)
        return {
            "start": snapshot.start.isoformat() if snapshot.start else None,
            "end": snapshot.end.isoformat() if snapshot.end else None,
            "now": snapshot.now.isoformat() if snapshot.now else None,
            "satellites": db.query(orm.SatelliteRow).count(),
            "stations": len(snapshot.stations),
            "passes": db.query(orm.PassRow).count(),
            "requests": len(snapshot.requests),
        }

    @app.get("/api/satellites", tags=["data"])
    def satellites(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
        return [{"id": row.id, "name": row.name} for row in db.query(orm.SatelliteRow).all()]

    @app.get("/api/stations", tags=["data"])
    def stations(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
        return [station_dict(s) for s in service.load_stations(db)]

    @app.get("/api/contacts", tags=["data"])
    def contacts(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
        return [contact_dict(c) for c in service.build_snapshot(db).contacts]

    @app.get("/api/requests", tags=["data"])
    def requests(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
        snapshot = service.build_snapshot(db)
        return request_dicts(snapshot.requests, snapshot.contacts, snapshot.result.unscheduled)

    @app.get("/api/metrics", tags=["data"])
    def metrics(db: Annotated[Session, Depends(get_db)]) -> dict:
        return service.build_snapshot(db).metrics

    @app.post("/api/requests", status_code=status.HTTP_201_CREATED, tags=["actions"])
    def add_request(
        body: NewRequest,
        _user: Annotated[str, Depends(current_user)],
        db: Annotated[Session, Depends(get_db)],
    ) -> dict:
        if db.get(orm.SatelliteRow, body.satellite_id) is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown satellite: {body.satellite_id}")
        row = service.create_request(db, body.satellite_id, body.duration_minutes * 60, body.priority, body.deadline)
        return {"id": row.id}

    @app.post("/api/stations/{station_id}/status", tags=["actions"])
    def update_station_status(
        station_id: str,
        body: StationStatusUpdate,
        _user: Annotated[str, Depends(current_user)],
        db: Annotated[Session, Depends(get_db)],
    ) -> dict:
        if not service.set_station_status(db, station_id, body.status):
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Unknown station: {station_id}")
        return {"station_id": station_id, "status": body.status.value}

    return app


app = create_app()
