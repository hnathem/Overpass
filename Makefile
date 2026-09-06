# Overpass — common tasks. Run these from the repository root.

# Run the package straight from src/ so it works with or without an install.
PY := PYTHONPATH=src python3

.PHONY: install demo test lint

install:
	python3 -m pip install -e ".[dev]"

# Build a scenario, schedule it, and print a summary.
demo:
	$(PY) -m overpass demo

test:
	python3 -m pytest -q

lint:
	python3 -m ruff check .
