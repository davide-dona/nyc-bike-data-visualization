import { chromium } from 'playwright'
import { mkdirSync, renameSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Records a demo video of the NYC Bike Data Visualization frontend.
 *
 * Walks through every page (Map, Temporal, Weather) and exercises the main
 * features: map layers and animation, global filters, the temporal compare
 * mode, and the weather charts. The full session is saved as a .webm video
 * in demo/recordings/.
 *
 * Requirements: the full app (database + backend + frontend) must be running.
 * Configuration via environment variables:
 *   BASE_URL  - frontend URL (default: http://localhost:5173)
 *   HEADLESS  - set to "1" to run without a visible browser window
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const HEADLESS = process.env.HEADLESS === '1'
const RECORDINGS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'recordings')

// Data queries can take a while on the full dataset
const DATA_TIMEOUT = 180_000
const VIEWPORT = { width: 1920, height: 1080 }

const log = (message) => console.log(`▶ ${message}`)

/** Waits until no loading overlay ("Fetching bike data...") is on screen. */
async function waitForData(page) {
    await page.waitForTimeout(600) // let the fetches kick off
    await page.waitForFunction(
        () => document.querySelectorAll('.status-wrap--loading').length === 0,
        { timeout: DATA_TIMEOUT },
    )
    await page.waitForTimeout(400)
}

/** Slowly sweeps the mouse across the map canvas to show hover tooltips. */
async function sweepMap(page, steps = 14) {
    const canvas = page.locator('.map-shell canvas').first()
    const box = await canvas.boundingBox()
    if (!box) return
    for (let i = 0; i <= steps; i++) {
        const x = box.x + box.width * (0.30 + (0.40 * i) / steps)
        const y = box.y + box.height * (0.40 + 0.12 * Math.sin((i / steps) * Math.PI * 2))
        await page.mouse.move(x, y, { steps: 4 })
        await page.waitForTimeout(220)
    }
}

/**
 * Clicks around the center of the map until a station gets picked
 * (deck.gl picking needs to hit an actual point, so we probe a few spots).
 * `isSelected` reports whether the click selected something.
 */
async function clickStation(page, isSelected) {
    const canvas = page.locator('.map-shell canvas').first()
    const box = await canvas.boundingBox()
    if (!box) return false
    const offsets = [
        [0, 0], [18, -14], [-22, 12], [36, 26], [-40, -28],
        [55, -45], [-65, 40], [14, 55], [-28, -55], [75, 18],
    ]
    for (const [dx, dy] of offsets) {
        await canvas.click({
            position: { x: Math.round(box.width / 2 + dx), y: Math.round(box.height / 2 + dy) },
        })
        await page.waitForTimeout(800)
        if (await isSelected()) return true
    }
    return false
}

/** Scrolls the page down in steps (for chart-heavy pages), then back to top. */
async function scrollTour(page, steps, stepPx = 550, pauseMs = 1600) {
    for (let i = 0; i < steps; i++) {
        await page.mouse.wheel(0, stepPx)
        await page.waitForTimeout(pauseMs)
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
    await page.waitForTimeout(1200)
}

async function demoMapPage(page) {
    log('Map page — Station usage layer')
    await waitForData(page)
    await page.waitForTimeout(2000) // hold the opening shot

    // Play the day animation, then crank the speed up to 4x
    await page.locator('.map-speed-controls__play-btn').click()
    await page.waitForTimeout(4000)
    await page.locator('[aria-label="Playback speed wheel"]').focus()
    await page.keyboard.press('End')
    await page.waitForTimeout(4000)
    await page.locator('.map-speed-controls__play-btn').click() // pause

    // Scrub the time wheel manually
    log('Map page — scrubbing the time wheel')
    await page.locator('[aria-label="Map time wheel"]').focus()
    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('PageDown')
        await page.waitForTimeout(150)
    }
    await page.waitForTimeout(1000)

    // Incoming / outgoing / all rides
    log('Map page — usage modes')
    await page.locator('[aria-label="Show incoming rides"]').click()
    await waitForData(page)
    await page.waitForTimeout(1500)
    await page.locator('[aria-label="Show outgoing rides"]').click()
    await waitForData(page)
    await page.waitForTimeout(1500)
    await page.locator('[aria-label="Show all rides"]').click()
    await waitForData(page)

    // Hover stations to show tooltips
    log('Map page — station tooltips')
    await sweepMap(page)

    // Fullscreen mode
    log('Map page — fullscreen')
    await page.locator('.map-fullscreen-button').click()
    await page.waitForTimeout(2500)
    await page.locator('.map-fullscreen-button').click()
    await page.waitForTimeout(1000)

    // Trip flow layer: select a station to isolate its arcs, then reset
    log('Map page — Trip flow layer')
    await page.locator('.layer-selector-btn', { hasText: 'Trip flow' }).click()
    await waitForData(page)
    await page.waitForTimeout(2000)
    const pickedTrip = await clickStation(page, () =>
        page.locator('.map-reset-button').isEnabled(),
    )
    if (pickedTrip) {
        await page.waitForTimeout(3000)
        await page.locator('.map-reset-button').click()
        await page.waitForTimeout(1500)
    }

    // Infrastructure layer: bike routes overlay + station detail sidebar
    log('Map page — Infrastructure layer')
    await page.locator('.layer-selector-btn', { hasText: 'Infrastructure' }).click()
    await waitForData(page)
    await page.locator('.map-toggle-button', { hasText: 'Show Routes' }).click()
    await waitForData(page)
    await page.waitForTimeout(2500)
    const pickedInfra = await clickStation(page, async () =>
        (await page.locator('.infra-sidebar.is-open').count()) > 0,
    )
    if (pickedInfra) {
        await waitForData(page)
        await page.waitForTimeout(3500)
        // Click an empty corner of the map to close the sidebar
        const canvas = page.locator('.map-shell canvas').first()
        await canvas.click({ position: { x: 40, y: 40 } })
        await page.waitForTimeout(1000)
    }
    await page.locator('.map-toggle-button', { hasText: 'Hide Routes' }).click()
    await waitForData(page)

    // Back to the default layer
    await page.locator('.layer-selector-btn', { hasText: 'Station usage' }).click()
    await waitForData(page)
}

async function demoHeaderFilters(page) {
    log('Header — rider & bike filters')
    const userGroup = page.locator('.rider-filter-group').nth(0)
    const bikeGroup = page.locator('.rider-filter-group').nth(1)

    await userGroup.locator('.rider-filter-btn', { hasText: 'Member' }).click()
    await waitForData(page)
    await page.waitForTimeout(1500)
    await bikeGroup.locator('.rider-filter-btn', { hasText: 'Electric Bike' }).click()
    await waitForData(page)
    await page.waitForTimeout(1500)
    await userGroup.locator('.rider-filter-btn', { hasText: 'All' }).click()
    await waitForData(page)
    await bikeGroup.locator('.rider-filter-btn', { hasText: 'All' }).click()
    await waitForData(page)

    log('Header — date window picker')
    await page.locator('.dw-input').first().click()
    await page.waitForTimeout(1200)
    const nextYear = page.locator('[aria-label="Next year"]')
    if (await nextYear.isEnabled()) {
        await nextYear.click()
        await page.waitForTimeout(800)
    }
    await page.locator('.dw-month-cell:not(.disabled)').first().click()
    await page.waitForTimeout(800)
    await page.keyboard.press('Escape')
    await waitForData(page)
}

async function demoTemporalPage(page) {
    log('Temporal page — 3D weekly surface')
    await page.locator('.nav-link', { hasText: 'Temporal' }).click()
    await waitForData(page)
    await page.waitForTimeout(2000)

    // Hover across the surface plot to link it with the histograms
    const surface = page.locator('.surface-plot-stack')
    const box = await surface.boundingBox()
    if (box) {
        for (let i = 0; i <= 10; i++) {
            await page.mouse.move(
                box.x + box.width * (0.30 + (0.35 * i) / 10),
                box.y + box.height * 0.45,
                { steps: 4 },
            )
            await page.waitForTimeout(280)
        }
    }

    // Switch metrics
    log('Temporal page — switching metrics')
    await page.locator('.surface-metric-btn', { hasText: 'Avg Duration' }).click()
    await waitForData(page)
    await page.waitForTimeout(2000)
    await page.locator('.surface-metric-btn', { hasText: 'Avg Speed' }).click()
    await waitForData(page)
    await page.waitForTimeout(2000)
    await page.locator('.surface-metric-btn', { hasText: 'Rides per Day' }).click()
    await waitForData(page)

    // Compare mode: overlay a "Casual" surface on top of the current one
    log('Temporal page — compare mode')
    await page.locator('.surface-compare-btn').click()
    await page.waitForTimeout(1000)
    await page.locator('.surface-compare-select').first().click()
    await page.waitForTimeout(600)
    await page.locator('.surface-compare-select-option', { hasText: 'Casual' }).click()
    await page.waitForTimeout(600)
    await page.locator('.surface-compare-add').click()
    await waitForData(page)
    await page.waitForTimeout(3000)

    // Re-open the panel to hide/show the layer, then reset
    await page.locator('.surface-compare-btn').click()
    await page.waitForTimeout(800)
    const layerToggle = page.locator('.surface-layer-toggle').first()
    await layerToggle.click()
    await page.waitForTimeout(1500)
    await layerToggle.click()
    await page.waitForTimeout(1500)
    await page.locator('.surface-compare-reset').click()
    await waitForData(page)
    await page.locator('.page-card__title').first().click() // close the panel
    await page.waitForTimeout(800)

    // Histograms, daily line chart, and the reading guide
    log('Temporal page — histograms & line chart')
    await scrollTour(page, 4)
}

async function demoWeatherPage(page) {
    log('Weather page — climate impact charts')
    await page.locator('.nav-link', { hasText: 'Weather' }).click()
    await waitForData(page)
    await page.waitForTimeout(2500)

    // Hover the weather scatter plot
    const scatter = page.locator('.page-card__body > div').first()
    const box = await scatter.boundingBox()
    if (box) {
        for (let i = 0; i <= 8; i++) {
            await page.mouse.move(
                box.x + box.width * (0.30 + (0.35 * i) / 8),
                box.y + box.height * 0.5,
                { steps: 4 },
            )
            await page.waitForTimeout(300)
        }
    }

    // Ridgeline, temperature response, rain impact, and the guide
    log('Weather page — scrolling through ridgeline & deep dives')
    await scrollTour(page, 5)

    // Toggle the visualization guide as a closing note
    const guideToggle = page.locator('.viz-guide__toggle-btn')
    await guideToggle.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)
    await guideToggle.click()
    await page.waitForTimeout(1200)
    await guideToggle.click()
    await page.waitForTimeout(1500)
}

async function main() {
    mkdirSync(RECORDINGS_DIR, { recursive: true })

    const browser = await chromium.launch({ headless: HEADLESS })
    const context = await browser.newContext({
        viewport: VIEWPORT,
        recordVideo: { dir: RECORDINGS_DIR, size: VIEWPORT },
    })
    const page = await context.newPage()
    page.setDefaultTimeout(60_000)
    const video = page.video()

    try {
        log(`Opening ${BASE_URL}`)
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })

        await demoMapPage(page)
        await demoHeaderFilters(page)
        await demoTemporalPage(page)
        await demoWeatherPage(page)

        log('Demo finished')
    } catch (error) {
        console.error('Demo failed (partial video is still saved):', error)
        process.exitCode = 1
    } finally {
        await context.close()
        await browser.close()
    }

    if (video) {
        const rawPath = await video.path()
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const finalPath = join(RECORDINGS_DIR, `nyc-bike-demo-${timestamp}.webm`)
        renameSync(rawPath, finalPath)
        log(`Video saved to ${finalPath}`)
    }
}

main()
