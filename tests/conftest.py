"""Shared fixtures for the database, service, and API tests.

Each test gets its own freshly seeded SQLite database in a temp folder, so tests
never share state.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from overpass.api import create_app
from overpass.db import get_session_factory
from overpass.seed import seed_database


@pytest.fixture
def db_url(tmp_path) -> str:
    return f"sqlite:///{tmp_path / 'overpass_test.db'}"


@pytest.fixture
def session(db_url):
    """A database session against a freshly seeded database."""
    seed_database(db_url)
    with get_session_factory()() as active:
        yield active


@pytest.fixture
def client(db_url) -> TestClient:
    """An API test client backed by a freshly seeded database."""
    seed_database(db_url)
    return TestClient(create_app())


@pytest.fixture
def auth_headers(client) -> dict[str, str]:
    """Authorization header for the default operator user."""
    response = client.post("/auth/token", data={"username": "operator", "password": "overpass"})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
