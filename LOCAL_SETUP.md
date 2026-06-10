# Local Setup (Linux, macOS)

## Downloading the dataset

A Python script automates downloading and merging of the trip data files based on specified date ranges. The script is located at `src/ingestion/cli.py` and downloads files from https://s3.amazonaws.com/tripdata/index.html.

```bash
export DATABASE_URL=postgresql://citibike:citibike@localhost:5432/citibike
python -m src.ingestion.cli
```

Database schema initialization executes ordered files from `postgres/schemas/`. For manual `psql` bootstrap, use `postgres/init.sql`.

Available options:

| Option | Description | Default |
|---|---|---|
| `--start-date` | Start date in `YYYYMM` format | `202501` |
| `--end-date` | End date in `YYYYMM` format | *(no end date)* |
| `--download-jc` | Include Jersey City dataset files | excluded |

## Backend

The backend is a FastAPI server located in `src/backend/`.

See [src/backend/README.md](src/backend/README.md) for detailed instructions on starting the server, setting up PostgreSQL, running tests, and accessing the API documentation.

## Frontend

The frontend is a React + Vite application located in `src/frontend/`.

See [src/frontend/README.md](src/frontend/README.md) for detailed instructions on installing dependencies, starting the development server, and running tests.
