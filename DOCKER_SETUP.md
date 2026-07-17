# Docker Setup

Prerequisites:

- Docker Desktop (Windows/macOS) or Docker Engine + Compose plugin (Linux)

## Quick start with pre-built images

The easiest way to run the application is to use the pre-built images from the latest release.
No need to clone the repository or build anything, Docker will automatically pull the correct image for your architecture (linux/amd64, linux/arm64).

> **Download Size:** ~1.2 GB | Final disk footprint: ~17 GB. To avoid a segmentation fault or installation failure, please ensure your system meets these storage requirements.

> **Time:** Deployment may take several minutes. This is primarily due to the PostgreSQL image. **Please do not interrupt or close the terminal once the build has started**.

> **Default data range:** The images are built filled with default data starting from January 2020 to the last month updated. If you want to customise the date range, please refer to the [Quick start from source](#quick-start-from-source) section below.

**1. Download `docker-compose.release.yml` from the [latest release](https://github.com/davide-dona/nyc-bike-data-visualization/releases/latest)**

**2. Run it:**

For Docker Engine:

```bash
docker compose -f docker-compose.release.yml up
```

For legacy Docker Compose:

```bash
docker-compose -f docker-compose.release.yml up
```

**3. Stop it:**

```bash
docker compose -f docker-compose.release.yml down
```

You can also run it from the Docker Desktop built-in terminal in the same way.

## Quick start from source
If you want to run the latest code or customise the date range, you can build the images locally.

Clone the repository and start all services with a single command:

```bash
git clone https://github.com/davide-dona/nyc-bike-data-visualization.git
cd nyc-bike-data-visualization
docker compose up --build
```

> **First run:** a dedicated seeder service downloads and processes the Citi Bike dataset before the backend starts. This can take several minutes depending on your connection. Subsequent starts are fast because the data is persisted in a Docker volume.

**Subsequent runs** (images already built, data already on volume):

```bash
docker compose up
```

**Stop without losing data:**

```bash
docker compose down
```

> Use `docker compose down -v` only if you want to wipe the database and downloaded data entirely and start fresh.

### Customise the date range

By default the seeder downloads data starting from January 2020. The variables are read by the seeder **at runtime**, so no rebuild is needed to change the range:

| Variable | Description | Example |
|---|---|---|
| `DATA_START_DATE` | Start month in `YYYYMM` format | `202001` |
| `DATA_END_DATE` | End month in `YYYYMM` format | `202112` |
| `DOWNLOAD_JC` | Set to `true` to include Jersey City data | `true` |

Inline (Linux/macOS):

```bash
DATA_START_DATE=202001 DATA_END_DATE=202112 docker compose up
```

On Windows (PowerShell):

```powershell
$env:DATA_START_DATE="202001"; $env:DATA_END_DATE="202112"; docker compose up
```

Or create a `.env` file in the repository root (Docker Compose picks it up automatically):

```env
DATA_START_DATE=202401
DATA_END_DATE=202412
# DOWNLOAD_JC=true
```

> **Note:** the seeder only adds months that are missing from the database. To shrink an already-seeded database (or start over with a different range), wipe the volumes first with `docker compose down -v`.

## Useful terminal checks

- Service status: `docker compose ps`
- Follow logs: `docker compose logs -f`
- Check backend logs: `docker compose logs -f backend`
- Check frontend logs: `docker compose logs -f frontend`

## Development with a pre-seeded database

Seeding the database locally takes a long time and ~17 GB of disk. For development, CI publishes **pre-seeded database images** to GHCR (`ghcr.io/davide-dona/nyc-bike-db`) so you can skip seeding entirely:

| Tag | Contents | Size |
|---|---|---|
| `dev` | Last 2 complete months (refreshed monthly on the 5th) | small, pulls in minutes |
| `latest` | Full dataset since January 2020 (refreshed monthly on the 5th) | ~17 GB on disk |

`docker-compose.dev.yml` starts **only** the pre-seeded database — no seeder involved. Run the backend and frontend locally from source (see [LOCAL_SETUP.md](LOCAL_SETUP.md)); the database is exposed on `localhost:5432`:

```bash
# Small dev database (default, recommended)
docker compose -f docker-compose.dev.yml up postgres

# Full database
DB_TAG=latest docker compose -f docker-compose.dev.yml up postgres
```

Notes:

- Each tag uses its own Docker volume (`nyc_bike_pg_dev` / `nyc_bike_pg_latest`), so switching between `dev` and `latest` always restores the right dataset.
- The dump inside the image is only restored into an **empty** volume. To pick up a refreshed `dev` image after the monthly update, wipe the volume first:

```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml pull postgres
docker compose -f docker-compose.dev.yml up postgres
```

If you want to seed an arbitrary date range locally instead, use the main `docker-compose.yml` with `DATA_START_DATE`/`DATA_END_DATE` as described [above](#customise-the-date-range).
