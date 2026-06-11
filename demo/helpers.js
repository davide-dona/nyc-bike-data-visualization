/**
 * Helpers for the demo tour: human-like interaction wrappers around the
 * shared Cursor instance, plus app-specific utilities (loading waits, map
 * zoom/pan/picking).
 */

import { Cursor } from './cursor.js'
import { easeInOut } from './humanize.js'

// Data queries can take a while on the full dataset
const DATA_TIMEOUT = 180_000

export const log = (message) => console.log(`▶ ${message}`)

// Single source of truth for the pointer position: every helper moves the
// mouse through this instance so the overlay never teleports.
export const cursor = new Cursor()

/* ------------------------------------------------------------------ */
/* Human-like mouse                                                    */
/* ------------------------------------------------------------------ */

/** Glides to an element (waiting until it is visible and enabled) and clicks it. */
export async function humanClick(page, locator, { dx = 0, dy = 0 } = {}) {
    await locator.waitFor({ state: 'visible' })
    const deadline = Date.now() + 30_000
    while (!(await locator.isEnabled()) && Date.now() < deadline) {
        await page.waitForTimeout(200)
    }
    await locator.scrollIntoViewIfNeeded()
    const box = await locator.boundingBox()
    if (!box) throw new Error('Element has no bounding box')
    await cursor.clickAt(page, box.x + box.width / 2 + dx, box.y + box.height / 2 + dy)
}

/** Presses the mouse on an element and drags it by (dx, dy) with easing. */
export async function humanDrag(page, locator, dx, dy, durationMs = 1200) {
    const box = await locator.boundingBox()
    if (!box) return
    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2
    await cursor.moveTo(page, startX, startY)
    await page.mouse.down()
    const steps = Math.max(15, Math.round(durationMs / 30))
    for (let i = 1; i <= steps; i++) {
        const t = easeInOut(i / steps)
        await page.mouse.move(startX + dx * t, startY + dy * t)
        await page.waitForTimeout(durationMs / steps)
    }
    await page.mouse.up()
    cursor.x = startX + dx
    cursor.y = startY + dy
}

/** Scrolls the window with small wheel bursts (mouse parked off the charts). */
export async function smoothScroll(page, totalPx) {
    const { h } = await page.evaluate(() => ({ h: window.innerHeight }))
    await cursor.moveTo(page, 30, h / 2) // neutral spot: charts capture wheel events
    const direction = Math.sign(totalPx)
    let remaining = Math.abs(totalPx)
    while (remaining > 0) {
        const burst = Math.min(remaining, 50 + Math.random() * 40)
        await page.mouse.wheel(0, direction * burst)
        remaining -= burst
        await page.waitForTimeout(35)
    }
}

/* ------------------------------------------------------------------ */
/* App helpers                                                         */
/* ------------------------------------------------------------------ */

/** Waits until no loading overlay ("Fetching bike data...") is on screen. */
export async function waitForData(page) {
    await page.waitForTimeout(600) // let the fetches kick off
    await page.waitForFunction(
        () => document.querySelectorAll('.status-wrap--loading').length === 0,
        { timeout: DATA_TIMEOUT },
    )
    await page.waitForTimeout(400)
}

export const mapCanvas = (page) => page.locator('.map-shell canvas').first()

/**
 * Zooms the map with the scroll wheel. Positive notches zoom in, negative
 * zoom out; (focusX, focusY) is the canvas point to zoom towards.
 */
export async function zoomMap(page, notches, focusX = 0.5, focusY = 0.5) {
    const box = await mapCanvas(page).boundingBox()
    if (!box) return
    await cursor.moveTo(page, box.x + box.width * focusX, box.y + box.height * focusY)
    for (let i = 0; i < Math.abs(notches); i++) {
        await page.mouse.wheel(0, notches > 0 ? -120 : 120)
        await page.waitForTimeout(400)
    }
    await page.waitForTimeout(600)
}

/** Drags the map by (dx, dy) to pan around. */
export async function panMap(page, dx, dy) {
    await humanDrag(page, mapCanvas(page), dx, dy, 1400)
    await page.waitForTimeout(600)
}

/** Slowly sweeps the cursor across the map to show hover tooltips. */
export async function sweepMap(page, steps = 7) {
    const box = await mapCanvas(page).boundingBox()
    if (!box) return
    for (let i = 0; i <= steps; i++) {
        const x = box.x + box.width * (0.32 + (0.36 * i) / steps)
        const y = box.y + box.height * (0.42 + 0.10 * Math.sin((i / steps) * Math.PI * 2))
        await cursor.moveTo(page, x, y)
        await page.waitForTimeout(450)
    }
}

/**
 * Clicks around the center of the map until a station gets picked
 * (deck.gl picking needs to hit an actual point, so we probe a few spots).
 * `isSelected` reports whether the click selected something.
 */
export async function clickStation(page, isSelected) {
    const box = await mapCanvas(page).boundingBox()
    if (!box) return false
    const offsets = [
        [0, 0], [18, -14], [-22, 12], [36, 26], [-40, -28],
        [55, -45], [-65, 40], [14, 55], [-28, -55], [75, 18],
    ]
    for (const [dx, dy] of offsets) {
        await cursor.clickAt(page, box.x + box.width / 2 + dx, box.y + box.height / 2 + dy)
        await page.waitForTimeout(800)
        if (await isSelected()) return true
    }
    return false
}
