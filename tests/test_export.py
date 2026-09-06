"""Tests for the static JSON export used by the dashboard."""

from __future__ import annotations

from overpass.export import build_payload, export_all


def test_payload_has_every_dataset():
    payload = build_payload()
    assert set(payload) >= {"meta", "satellites", "stations", "contacts", "requests", "metrics"}
    assert len(payload["satellites"]) == 10
    assert len(payload["stations"]) == 6


def test_payload_meta_and_statuses():
    payload = build_payload()
    meta = payload["meta"]
    assert meta["start"] <= meta["now"] <= meta["end"]

    # There should be both booked and bumped requests, and a mix of outcomes.
    assert any(row["scheduled"] for row in payload["requests"])
    assert any(not row["scheduled"] for row in payload["requests"])
    statuses = {contact["status"] for contact in payload["contacts"]}
    assert statuses & {"completed", "failed", "scheduled"}


def test_export_writes_files(tmp_path):
    written = export_all(tmp_path)
    for name in written:
        assert (tmp_path / f"{name}.json").exists()
