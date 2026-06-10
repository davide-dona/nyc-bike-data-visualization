# Local Setup (Linux, macOS)

Run the backend and frontend from source for development. For an all-in-one
Docker stack instead, see [DOCKER_SETUP.md](DOCKER_SETUP.md).

## Prerequisites

- [uv](https://docs.astral.sh/uv/) — the Python dependency manager:
  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```
- A PostgreSQL 16 database — see [Database](#database) below.
- Node.js 20+ for the frontend.

## Install Python dependencies

From the repository root:

```bash
uv sync
```

This creates a virtual environment in `.venv/` with the backend and ingestion
dependencies, pinned by `uv.lock`. Run any command inside it with
`uv run <command>` — no manual activation needed. To also install the
Jupyter/visualization stack used by the notebooks:

```bash
uv sync --group notebooks
```

## Database

The backend and ingestion read the connection URL from their `config.yaml`
(`postgresql://citibike:citibike@localhost:5432/citibike` by default). Override
it with the `DATABASE_URL` environment variable if your setup differs. Pick one
of the options below.

### Option A — Pre-seeded dev database (recommended)

Pulls a small, already-seeded image so you can skip the slow data download:

```bash
docker compose -f docker-compose.dev.yml up postgres
```

The database is exposed on `localhost:5432`. See
[DOCKER_SETUP.md](DOCKER_SETUP.md#development-with-a-pre-seeded-database) for the
available image tags. With this option you can skip
[Downloading the dataset](#downloading-the-dataset).

### Option B — Empty database (seed it yourself)

Start an empty PostgreSQL 16, then download the dataset (next section). Either:

- **Docker:** `docker compose up postgres -d` — starts `postgres:16-alpine` on
  port `5432`, or
- **Local install:**
  - macOS: `brew install postgresql@16 && brew services start postgresql@16`
  - Linux (Ubuntu/Debian): `sudo apt install postgresql-16 && sudo systemctl start postgresql`

  Then create the user and database:

  ```bash
  psql postgres -c "CREATE USER citibike WITH PASSWORD 'citibike';"
  psql postgres -c "CREATE DATABASE citibike OWNER citibike;"
  ```

## Downloading the dataset

*Skip this if you used the pre-seeded dev database (Option A).*

A script downloads and merges the Citi Bike trip data files for a date range
(from <https://s3.amazonaws.com/tripdata/index.html>) and initializes the schema
(ordered files from `postgres/schemas/`; for a manual `psql` bootstrap use
`postgres/init.sql`).

```bash
uv run python -m src.ingestion.cli
```

Available options (defaults come from `src/ingestion/config.yaml`):

| Option | Description | Default |
|---|---|---|
| `--start-date` | Start date in `YYYYMM` format | `202001` |
| `--end-date` | End date in `YYYYMM` format | *(most recent complete month)* |
| `--download-jc` | Include Jersey City dataset files | excluded |

## Run the backend

```bash
uv run uvicorn src.backend.main:app --reload
```

The API is served at <http://localhost:8000> (interactive docs at `/docs`). For
backend architecture, endpoints, and tests, see
[src/backend/README.md](src/backend/README.md).

## Run the frontend

See [src/frontend/README.md](src/frontend/README.md) for installing
dependencies, starting the dev server, and running tests.
