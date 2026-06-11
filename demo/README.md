# Demo Tour

A [Playwright](https://playwright.dev/) script that drives the running application through all three pages — **Map**, **Temporal**, and **Weather** — exercising the main features along the way. It opens a regular, maximized Chromium window and interacts with the page like a real user — the cursor glides along eased paths, the time/speed wheels are dragged with the mouse, and the map is zoomed and panned to show detail — so you can capture the session with your screen-recording tool of choice. Since synthetic mouse events don't move the OS cursor, the script renders its own on-screen pointer with press and click-ripple animations, so every interaction is visible in the recording.

What the tour covers:

- **Map page:** the day animation with the time and speed wheels, the incoming/outgoing/all usage modes, zooming into Manhattan for station tooltips and panning around, fullscreen mode, the *Trip flow* layer (station selection + reset), and the *Infrastructure* layer (bike routes overlay + station detail sidebar).
- **Global filters:** the rider/bike type filters and the date window picker in the header.
- **Temporal page:** hovering and rotating the 3D weekly surface, switching metrics, compare mode (adding, hiding, and resetting a comparison surface), histograms, and the daily line chart.
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

## Running the tour

Start your screen recorder, then:

```bash
npm run demo
```

A maximized Chromium window opens and runs the tour (roughly 3–5 minutes, depending on query times); progress for each section is printed to the terminal. The window uses no fixed viewport, so the app renders responsively, exactly as in a regular browser.

To point the tour at a different frontend URL:

```bash
BASE_URL=http://localhost:5173 npm run demo
```
