[![Backend Tests](https://github.com/446f6e6e79/nyc-bike-data-visualization/actions/workflows/backend-tests.yml/badge.svg?branch=main)](https://github.com/446f6e6e79/nyc-bike-data-visualization/actions/workflows/backend-tests.yml)
[![Frontend Tests](https://github.com/446f6e6e79/nyc-bike-data-visualization/actions/workflows/frontend-tests.yml/badge.svg)](https://github.com/446f6e6e79/nyc-bike-data-visualization/actions/workflows/frontend-tests.yml)

# NYC Bike Data Visualization

A comprehensive data visualization solution developed for advanced coursework at the University of Trento, Master's Degree in Computer Science.

**Course:** Data Visualization Lab  
**Professors:** Prof. Monica Moroni, Prof. Shahryar Noei  
**Authors:** Davide Donà, Andrea Blushi, Lorenzo Di Berardino

## Overview

This project focuses on the visualization of bike-sharing data from New York City, specifically utilizing the Citi Bike Trip Data. The goal is to create an interactive web application that allows users to explore and analyze the bike-sharing patterns in NYC through various visualizations and insights derived from the dataset.

## Repository Structure

```
data-visualisation/
├── README.md                         # Project overview (this file)
├── DOCKER_SETUP.md                   # Docker setup guide (all workflows)
├── LOCAL_SETUP.md                    # Local development setup guide
├── docker-compose.yml                # Docker Compose configuration (full stack, seeds locally)
├── docker-compose.dev.yml            # Development stack with a pre-seeded database image
├── dockers/                          # Dockerfiles for all services (db, seeder, backend, frontend)
├── src/
│   └── backend                       # Backend server implementation (FastAPI)
│   └── frontend                      # Frontend application implementation (React)
│   └── ingestion                     # Data ingestion pipeline (download, process, load into Postgres)
├── docs/
│   └── proposal/                     # Project proposal latex files
│   └── technical-report/             # Technical report latex files
│   └── report/                       # Final report latex files
```

## Getting Started

| Approach | Best for | Guide |
|---|---|---|
| Pre-built Docker images | Quickest start, no clone needed | [DOCKER_SETUP.md](DOCKER_SETUP.md#quick-start-with-pre-built-images) |
| Docker from source | Full control, custom date range | [DOCKER_SETUP.md](DOCKER_SETUP.md#quick-start-from-source) |
| Local development | Active development without full Docker | [LOCAL_SETUP.md](LOCAL_SETUP.md) |

## Application Access

Once the services are up and running:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API docs | http://localhost:8000/docs |
