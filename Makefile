# Overpass — common tasks. Run these from the repository root.

# Run the package straight from src/ so it works with or without an install.
PY := PYTHONPATH=src python3

.PHONY: install demo seed api export test lint

install:
	python3 -m pip install -e ".[dev]"

# Build a scenario, schedule it, and print a summary (no database needed).
demo:
	$(PY) -m overpass demo

# Load a scenario into the database and create the default operator user.
seed:
	$(PY) -m overpass.seed

# Run the API locally at http://127.0.0.1:8000 (interactive docs at /docs).
api:
	PYTHONPATH=src uvicorn overpass.api:app --reload

# Export the schedule to static JSON for the dashboard.
export:
	$(PY) -m overpass.export --out web/public/data

test:
	python3 -m pytest -q

lint:
	python3 -m ruff check .
