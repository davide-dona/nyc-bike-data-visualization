[![Backend Tests](https://github.com/446f6e6e79/nyc-bike-data-visualization/actions/workflows/backend-tests.yml/badge.svg?branch=main)](https://github.com/446f6e6e79/nyc-bike-data-visualization/actions/workflows/backend-tests.yml)
[![Frontend Tests](https://github.com/446f6e6e79/nyc-bike-data-visualization/actions/workflows/frontend-tests.yml/badge.svg)](https://github.com/446f6e6e79/nyc-bike-data-visualization/actions/workflows/frontend-tests.yml)

<div align="center">

# NYC Bike Data Visualization

Interactive exploration of New York City's Citi Bike trip data.

**Data Visualization Lab** · University of Trento, MSc Computer Science<br/>
Prof. Monica Moroni · Prof. Shahryar Noei<br/>
Davide Donà · Andrea Blushi · Lorenzo Di Berardino

</div>

## Overview

This project focuses on the visualization of bike-sharing data from New York City, specifically utilizing the Citi Bike Trip Data. The goal is to create an interactive web application that allows users to explore and analyze the bike-sharing patterns in NYC through various visualizations and insights derived from the dataset.

## Getting Started

The fastest way to run the full application is with the **pre-built release images**: a complete, pre-seeded database and ready-to-run backend and frontend. No clone, no build.

**1. Download `docker-compose.release.yml` from the [latest release](https://github.com/446f6e6e79/nyc-bike-data-visualization/releases/latest).**

**2. Start everything:**

```bash
docker compose -f docker-compose.release.yml up
```

That's it. Once the services are up, open:

- **Frontend:** http://localhost:5173
- **Backend API docs:** http://localhost:8000/docs

> First start pulls ~1.2 GB and uses ~17 GB on disk; bringing up the database can take several minutes, so don't interrupt it. See [DOCKER_SETUP.md](DOCKER_SETUP.md#quick-start-with-pre-built-images) for storage notes and custom date ranges.

### Development setup

For development, run only the pre-seeded database in Docker, then start the backend and frontend locally for hot-reloading:

**1. Start the dev database (pulls a pre-seeded image, no seeding needed):**

```bash
docker compose -f docker-compose.dev.yml up postgres
```

**2. Run the backend and frontend on your machine.** Follow [LOCAL_SETUP.md](LOCAL_SETUP.md) for the rest of the setup.

> The database is exposed on `localhost:5432`. See [DOCKER_SETUP.md](DOCKER_SETUP.md#development-with-a-pre-seeded-database) for database image tags (`dev` vs `latest`).

## Components

- [Backend](src/backend/README.md): FastAPI server, PostgreSQL setup, running tests, API docs
- [Frontend](src/frontend/README.md): React + Vite app, development server, running tests

## Repository Structure

```
nyc-bike-data-visualization/
├── src/                      # Application source (backend, frontend, ingestion)
├── postgres/                 # Database schema files and init scripts
├── dockers/                  # Dockerfiles for all services
├── docs/                     # Project reports (proposal, technical, final)
├── docker-compose.yml        # Full stack from source (seeds the DB locally)
├── docker-compose.dev.yml    # Dev stack (pre-seeded DB image)
├── DOCKER_SETUP.md           # All Docker workflows
└── LOCAL_SETUP.md            # Local development setup
```
