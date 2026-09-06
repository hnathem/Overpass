"""Tests for the HTTP API: auth, the data endpoints, and the protected actions."""

from __future__ import annotations


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_login_and_me(client, auth_headers):
    body = client.get("/auth/me", headers=auth_headers).json()
    assert body["username"] == "operator"


def test_login_rejects_a_bad_password(client):
    response = client.post("/auth/token", data={"username": "operator", "password": "wrong"})
    assert response.status_code == 401


def test_me_requires_a_token(client):
    assert client.get("/auth/me").status_code == 401


def test_data_endpoints(client):
    assert len(client.get("/api/satellites").json()) == 10
    assert len(client.get("/api/stations").json()) == 6

    contacts = client.get("/api/contacts").json()
    assert len(contacts) > 0

    metrics = client.get("/api/metrics").json()
    assert metrics["scheduled"] + metrics["unscheduled"] == metrics["total_requests"]

    requests = client.get("/api/requests").json()
    assert any(row["scheduled"] for row in requests)
    assert any(not row["scheduled"] for row in requests)


def test_creating_a_request_requires_auth(client):
    response = client.post(
        "/api/requests", json={"satellite_id": "LEO-001", "duration_minutes": 5, "priority": 4}
    )
    assert response.status_code == 401


def test_creating_a_request_with_auth(client, auth_headers):
    before = len(client.get("/api/requests").json())
    response = client.post(
        "/api/requests",
        json={"satellite_id": "LEO-001", "duration_minutes": 5, "priority": 4},
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["id"].startswith("REQ-")
    assert len(client.get("/api/requests").json()) == before + 1


def test_creating_a_request_for_unknown_satellite(client, auth_headers):
    response = client.post(
        "/api/requests",
        json={"satellite_id": "LEO-999", "duration_minutes": 5, "priority": 4},
        headers=auth_headers,
    )
    assert response.status_code == 404


def test_taking_a_station_offline_changes_the_schedule(client, auth_headers):
    response = client.post(
        "/api/stations/GS-DUBLIN/status", json={"status": "offline"}, headers=auth_headers
    )
    assert response.status_code == 200

    contacts = client.get("/api/contacts").json()
    assert all(contact["station_id"] != "GS-DUBLIN" for contact in contacts)
