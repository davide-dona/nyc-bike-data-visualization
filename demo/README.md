# Demo Video Recorder

A [Playwright](https://playwright.dev/) script that drives the running application through all three pages — **Map**, **Temporal**, and **Weather** — exercising the main features along the way, and records the session as a video.

What the tour covers:

- **Map page:** the day animation with the time and speed wheels, the incoming/outgoing/all usage modes, station tooltips, fullscreen mode, the *Trip flow* layer (station selection + reset), and the *Infrastructure* layer (bike routes overlay + station detail sidebar).
- **Global filters:** the rider/bike type filters and the date window picker in the header.
- **Temporal page:** hovering the 3D weekly surface, switching metrics, compare mode (adding, hiding, and resetting a comparison surface), histograms, and the daily line chart.
- **Weather page:** the weather scatter plot, ridgeline, temperature response, rain impact, and the visualization guide.

## Prerequisites

- Node.js 20+
- The full application running locally (database, backend, and frontend) — see [LOCAL_SETUP.md](../docs/setup/LOCAL_SETUP.md) or [DOCKER_SETUP.md](../docs/setup/DOCKER_SETUP.md). By default the script expects the frontend at `http://localhost:5173`.

## Setup

From this directory (`demo/`):

```bash
npm install
npx playwright install chromium
```

## Recording a demo

```bash
npm run demo
```

A Chromium window opens and runs the tour (roughly 3–5 minutes, depending on query times). The recording is saved to `recordings/nyc-bike-demo-<timestamp>.webm`; the path is printed at the end.

Options via environment variables:

| Variable | Description | Default |
|---|---|---|
| `BASE_URL` | Frontend URL to record | `http://localhost:5173` |
| `HEADLESS` | Set to `1` to record without opening a browser window | headed |

```bash
BASE_URL=http://localhost:5173 HEADLESS=1 npm run demo
```

## Converting to MP4

Playwright records WebM. If you need an MP4 (e.g., for slides), convert it with [ffmpeg](https://ffmpeg.org/):

```bash
ffmpeg -i recordings/nyc-bike-demo-<timestamp>.webm -c:v libx264 -crf 20 demo.mp4
```
