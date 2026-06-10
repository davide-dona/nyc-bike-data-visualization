# Backend

This directory contains the backend server implementation for the bike-sharing data visualization project. It is built using FastAPI, a modern web framework for building APIs with Python.

It offers endpoints to retrieve real-time and historical data about bike stations, including their locations, available bikes, and docks.

## Environment setup

Dependencies (via `uv`), the PostgreSQL database, and the dataset are covered in [LOCAL_SETUP.md](../../LOCAL_SETUP.md). Set that up first, then run the commands below from the **project root**.

The connection URL defaults to `postgresql://citibike:citibike@localhost:5432/citibike` (from `config.yaml`) and can be overridden with the `DATABASE_URL` environment variable.

## Starting the Server

Make sure you have a seeded database — see [LOCAL_SETUP.md](../../LOCAL_SETUP.md#database).

```bash
uv run uvicorn src.backend.main:app --reload
```

This launches the FastAPI server with hot-reloading at `http://localhost:8000`.

## Running Backend Tests

Tests run against a dedicated `citibike_test` database, separate from the development `citibike` DB.

**1. Create the test database** (one-time setup):

```bash
psql postgres -c "CREATE DATABASE citibike_test OWNER citibike;"
```

**2. Point to the test database and seed it:**

```bash
export DATABASE_URL=postgresql://citibike:citibike@localhost:5432/citibike_test
uv run python -m src.ingestion.load_test_data
```

**3. Start the server:**

```bash
uv run uvicorn src.backend.main:app --host 127.0.0.1 --port 8000
```

**4. In a second terminal, run the tests:**

```bash
uv run pytest src/backend/tests -q
```

## API Documentation

Once the server is running, you can access the automatically generated API documentation by navigating to:

```
http://localhost:8000/docs
```

This interactive documentation provides details about the available endpoints, request/response formats, and allows you to test the API directly from your browser.

## Project structure

```
src/backend/
├── main.py                       # Application entry point
├── config.py                     # Environment-sensitive configuration
├── db.py                         # Connection pool
├── models/                       # API response models
│   ├── bike_route.py
│   ├── ride.py
│   ├── station.py
│   └── stats/
│       ├── date_range.py
│       ├── station_flow_counts.py
│       ├── station_ride_counts.py
│       └── stats.py
├── routes/                       # Thin endpoint handlers
│   ├── bike_routes.py
│   ├── stations.py
│   └── stats.py
├── services/                     # Data retrieval and processing logic
│   ├── bike_routes.py
│   ├── gbfs.py                   # Real-time station status (Lyft GBFS feed)
│   └── stats/
│       ├── stats.py              # Orchestrator
│       ├── utils.py              # Shared helpers
│       ├── coverage.py
│       ├── station_flow_counts.py
│       └── station_ride_counts.py
└── tests/                        # Integration tests
    ├── test_data/                # Fixture CSVs
    ├── test_bike_routes.py
    ├── test_stations.py
    ├── test_stats.py
    ├── test_docs.py
    └── test_helpers.py
```
