import { chromium } from 'playwright'
import { injectMacCursor } from './cursor.js'
import {
    clickStation,
    cursor,
    humanClick,
    humanDrag,
    log,
    mapCanvas,
    panMap,
    smoothScroll,
    sweepMap,
    waitForData,
    zoomMap,
} from './helpers.js'

/**
 * Drives the NYC Bike Data Visualization frontend through a full demo tour.
 *
 * Opens a maximized Chromium window and walks through every page (Map,
 * Temporal, Weather) like a real user: a visible cursor glides along curved,
 * eased paths and ripples on every click, the wheels are dragged with the
 * mouse, and the map is zoomed and panned to show detail. Record the screen
 * with your own tooling while it runs.
 *
 * Requirements: the full app (database + backend + frontend) must be running.
 * Configuration via environment variables:
 *   BASE_URL  - frontend URL (default: http://localhost:5173)
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'

/* ------------------------------------------------------------------ */
/* Tour sections                                                       */
/* ------------------------------------------------------------------ */

async function demoMapPage(page) {
    log('Map page — Station usage layer')
    await waitForData(page)
    await page.waitForTimeout(2000) // hold the opening shot

    // Play the day animation, then drag the speed wheel up to go faster
    await humanClick(page, page.locator('.map-speed-controls__play-btn'))
    await page.waitForTimeout(4000)
    await humanDrag(page, page.locator('[aria-label="Playback speed wheel"]'), 60, 0, 900)
    await page.waitForTimeout(4000)
    await humanClick(page, page.locator('.map-speed-controls__play-btn')) // pause

    // Scrub the time wheel by dragging it
    log('Map page — scrubbing the time wheel')
    const timeWheel = page.locator('[aria-label="Map time wheel"]')
    await humanDrag(page, timeWheel, -160, 0, 1600)
    await page.waitForTimeout(800)
    await humanDrag(page, timeWheel, 90, 0, 1100)
    await page.waitForTimeout(800)

    // Incoming / outgoing / all rides
    log('Map page — usage modes')
    await humanClick(page, page.locator('[aria-label="Show incoming rides"]'))
    await waitForData(page)
    await page.waitForTimeout(1500)
    await humanClick(page, page.locator('[aria-label="Show outgoing rides"]'))
    await waitForData(page)
    await page.waitForTimeout(1500)
    await humanClick(page, page.locator('[aria-label="Show all rides"]'))
    await waitForData(page)

    // Zoom into Manhattan to read individual stations, hover a few, pan around
    log('Map page — zooming in, station tooltips')
    await zoomMap(page, 4, 0.45, 0.55)
    await sweepMap(page)
    await panMap(page, -180, 100)
    await sweepMap(page, 4)
    await zoomMap(page, -4)

    // Fullscreen mode
    log('Map page — fullscreen')
    await humanClick(page, page.locator('.map-fullscreen-button'))
    await page.waitForTimeout(2500)
    await humanClick(page, page.locator('.map-fullscreen-button'))
    await page.waitForTimeout(1000)

    // Trip flow layer: zoom in, select a station to isolate its arcs, zoom
    // back out to see where they reach, then reset
    log('Map page — Trip flow layer')
    await humanClick(page, page.locator('.layer-selector-btn', { hasText: 'Trip flow' }))
    await waitForData(page)
    await page.waitForTimeout(2000)
    await zoomMap(page, 2, 0.5, 0.5)
    const pickedTrip = await clickStation(page, () =>
        page.locator('.map-reset-button').isEnabled(),
    )
    if (pickedTrip) {
        await page.waitForTimeout(2500)
        await zoomMap(page, -2)
        await page.waitForTimeout(2500)
        await humanClick(page, page.locator('.map-reset-button'))
        await page.waitForTimeout(1500)
    } else {
        await zoomMap(page, -2)
    }

    // Infrastructure layer: bike routes overlay + station detail sidebar
    log('Map page — Infrastructure layer')
    await humanClick(page, page.locator('.layer-selector-btn', { hasText: 'Infrastructure' }))
    await waitForData(page)
    await humanClick(page, page.locator('.map-toggle-button', { hasText: 'Show Routes' }))
    await waitForData(page)
    await page.waitForTimeout(1500)

    // Zoom in and pan along the network to show route detail
    await zoomMap(page, 3, 0.5, 0.5)
    await panMap(page, 200, -80)
    await page.waitForTimeout(1000)
    const pickedInfra = await clickStation(page, async () =>
        (await page.locator('.infra-sidebar.is-open').count()) > 0,
    )
    if (pickedInfra) {
        await waitForData(page)
        await page.waitForTimeout(3500)
        // Click an empty corner of the map to close the sidebar
        const box = await mapCanvas(page).boundingBox()
        await cursor.clickAt(page, box.x + 40, box.y + 40)
        await page.waitForTimeout(1000)
    }
    await zoomMap(page, -3)
    await humanClick(page, page.locator('.map-toggle-button', { hasText: 'Hide Routes' }))
    await waitForData(page)

    // Back to the default layer
    await humanClick(page, page.locator('.layer-selector-btn', { hasText: 'Station usage' }))
    await waitForData(page)
}

async function demoHeaderFilters(page) {
    log('Header — rider & bike filters')
    const userGroup = page.locator('.rider-filter-group').nth(0)
    const bikeGroup = page.locator('.rider-filter-group').nth(1)

    await humanClick(page, userGroup.locator('.rider-filter-btn', { hasText: 'Member' }))
    await waitForData(page)
    await page.waitForTimeout(1500)
    await humanClick(page, bikeGroup.locator('.rider-filter-btn', { hasText: 'Electric Bike' }))
    await waitForData(page)
    await page.waitForTimeout(1500)
    await humanClick(page, userGroup.locator('.rider-filter-btn', { hasText: 'All' }))
    await waitForData(page)
    await humanClick(page, bikeGroup.locator('.rider-filter-btn', { hasText: 'All' }))
    await waitForData(page)

    log('Header — date window picker')
    await humanClick(page, page.locator('.dw-input').first())
    await page.waitForTimeout(1200)
    const nextYear = page.locator('[aria-label="Next year"]')
    if (await nextYear.isEnabled()) {
        await humanClick(page, nextYear)
        await page.waitForTimeout(800)
    }
    await humanClick(page, page.locator('.dw-month-cell:not(.disabled)').first())
    await page.waitForTimeout(800)
    await humanClick(page, page.locator('.page-card__title').first()) // close the picker
    await waitForData(page)
}

async function demoTemporalPage(page) {
    log('Temporal page — 3D weekly surface')
    await humanClick(page, page.locator('.nav-link', { hasText: 'Temporal' }))
    await waitForData(page)
    await page.waitForTimeout(2000)

    // Hover across the surface plot to link it with the histograms,
    // then drag to rotate the 3D camera a little
    const surface = page.locator('.surface-plot-stack')
    const box = await surface.boundingBox()
    if (box) {
        for (let i = 0; i <= 6; i++) {
            await cursor.moveTo(
                page,
                box.x + box.width * (0.32 + (0.32 * i) / 6),
                box.y + box.height * 0.45,
            )
            await page.waitForTimeout(500)
        }
        log('Temporal page — rotating the surface')
        await humanDrag(page, surface, 90, -40, 1800)
        await page.waitForTimeout(1500)
        await humanDrag(page, surface, -90, 40, 1500)
        await page.waitForTimeout(1000)
    }

    // Switch metrics
    log('Temporal page — switching metrics')
    await humanClick(page, page.locator('.surface-metric-btn', { hasText: 'Avg Duration' }))
    await waitForData(page)
    await page.waitForTimeout(2000)
    await humanClick(page, page.locator('.surface-metric-btn', { hasText: 'Avg Speed' }))
    await waitForData(page)
    await page.waitForTimeout(2000)
    await humanClick(page, page.locator('.surface-metric-btn', { hasText: 'Rides per Day' }))
    await waitForData(page)

    // Compare mode: overlay a "Casual" surface on top of the current one
    log('Temporal page — compare mode')
    await humanClick(page, page.locator('.surface-compare-btn'))
    await page.waitForTimeout(1000)
    await humanClick(page, page.locator('.surface-compare-select').first())
    await page.waitForTimeout(600)
    await humanClick(page, page.locator('.surface-compare-select-option', { hasText: 'Casual' }))
    await page.waitForTimeout(600)
    await humanClick(page, page.locator('.surface-compare-add'))
    await waitForData(page)
    await page.waitForTimeout(3000)

    // Re-open the panel to hide/show the layer, then reset
    await humanClick(page, page.locator('.surface-compare-btn'))
    await page.waitForTimeout(800)
    const layerToggle = page.locator('.surface-layer-toggle').first()
    await humanClick(page, layerToggle)
    await page.waitForTimeout(1500)
    await humanClick(page, layerToggle)
    await page.waitForTimeout(1500)
    await humanClick(page, page.locator('.surface-compare-reset'))
    await waitForData(page)
    await humanClick(page, page.locator('.page-card__title').first()) // close the panel
    await page.waitForTimeout(800)

    // Histograms, daily line chart, and the reading guide
    log('Temporal page — histograms & line chart')
    await smoothScroll(page, 900)
    await page.waitForTimeout(2200)
    await smoothScroll(page, 900)
    await page.waitForTimeout(2200)
    await smoothScroll(page, -1800)
    await page.waitForTimeout(1200)
}

async function demoWeatherPage(page) {
    log('Weather page — climate impact charts')
    await humanClick(page, page.locator('.nav-link', { hasText: 'Weather' }))
    await waitForData(page)
    await page.waitForTimeout(2500)

    // Hover the weather scatter plot
    const scatter = page.locator('.page-card__body > div').first()
    const box = await scatter.boundingBox()
    if (box) {
        for (let i = 0; i <= 6; i++) {
            await cursor.moveTo(
                page,
                box.x + box.width * (0.32 + (0.32 * i) / 6),
                box.y + box.height * 0.5,
            )
            await page.waitForTimeout(500)
        }
    }

    // Ridgeline, temperature response, rain impact, and the guide
    log('Weather page — scrolling through ridgeline & deep dives')
    await smoothScroll(page, 900)
    await page.waitForTimeout(2200)
    await smoothScroll(page, 900)
    await page.waitForTimeout(2200)
    await smoothScroll(page, 900)
    await page.waitForTimeout(2200)

    // Toggle the visualization guide as a closing note
    const guideToggle = page.locator('.viz-guide__toggle-btn')
    await guideToggle.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1000)
    await humanClick(page, guideToggle)
    await page.waitForTimeout(1200)
    await humanClick(page, guideToggle)
    await page.waitForTimeout(1500)
}

async function main() {
    // No fixed viewport: the page fills the real (maximized) window and stays
    // responsive, exactly as in a regular browser.
    const browser = await chromium.launch({
        headless: false,
        args: ['--start-maximized'],
    })
    const context = await browser.newContext({ viewport: null })
    const page = await context.newPage()
    page.setDefaultTimeout(60_000)

    try {
        log(`Opening ${BASE_URL}`)
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
        await injectMacCursor(page, cursor)

        await demoMapPage(page)
        await demoHeaderFilters(page)
        await demoTemporalPage(page)
        await demoWeatherPage(page)

        log('Demo finished')
    } catch (error) {
        console.error('Demo failed:', error)
        process.exitCode = 1
    } finally {
        await context.close()
        await browser.close()
    }
}

main()
