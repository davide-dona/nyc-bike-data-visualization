import { ArcLayer } from '@deck.gl/layers'
import {
    ACCENT_RGB,
    ACCENT_INK_RGB,
    ACCENT_SOFT_RGB,
    INK_MUTED_RGB,
    WARM_HIGHLIGHT_RGB,
    RUST_RGB,
} from '@/utils/editorialTokens.js'
import { classifyBalance } from './tripArcsSelector.js'
import { formatCount, formatNumber } from '@/utils/numberFormat.js'

// Overview: a dense web of thin translucent arcs where volume drives
// width, opacity, and a single-hue ramp. Focus: solid diverging colors by
// net direction, with volume in width and opacity only.
const OVERVIEW_BASE_WIDTH = 1
const OVERVIEW_WIDTH_RANGE = 5
const OVERVIEW_BASE_ALPHA = 25
const OVERVIEW_ALPHA_RANGE = 205
const FOCUS_BASE_WIDTH = 1
const FOCUS_WIDTH_RANGE = 6
const FOCUS_BASE_ALPHA = 30
const FOCUS_ALPHA_RANGE = 195
const HOVER_WIDTH_BONUS = 2
// Ramp midpoint: below it colors run soft → accent, above accent → ink.
const RAMP_SPLIT = 0.6
// Overview emphasis: the ranked (listed) corridors get an opacity floor and a
// width bonus while the long tail is dimmed, so the strongest corridors pop.
const EMPHASIS_ALPHA_FLOOR = 210
const EMPHASIS_WIDTH_BONUS = 1.5
const TAIL_ALPHA_FACTOR = 0.4

const FOCUS_COLORS = {
    outbound: ACCENT_RGB,
    inbound: RUST_RGB,
    balanced: INK_MUTED_RGB,
}

/**
 * Normalizes a trip's daily flow to 0-1 with a square-root ramp, so the
 * busiest (outlier) corridors do not crush the mid-range into invisibility.
 * @param {Object} trip - Processed trip row.
 * @param {number} maxTripCount - Maximum total_daily_flow across trips.
 * @returns {number} Normalized volume in [0, 1].
 */
function normalizeTripUsage(trip, maxTripCount) {
    if (!(maxTripCount > 0)) return 0
    return Math.sqrt((Number(trip.total_daily_flow) || 0) / maxTripCount)
}

/**
 * Linear interpolation between two RGB triplets.
 * @param {number[]} from - Start RGB.
 * @param {number[]} to - End RGB.
 * @param {number} t - Interpolation factor in [0, 1].
 * @returns {number[]} Interpolated RGB.
 */
function lerpColor(from, to, t) {
    return from.map((c, i) => Math.round(c + (to[i] - c) * t))
}

/**
 * Single-hue volume ramp for overview arcs: soft blue for quiet corridors,
 * accent at the ramp split, ink blue for the busiest.
 * @param {number} t - Normalized volume in [0, 1].
 * @returns {number[]} RGB triplet.
 */
function rampArcColor(t) {
    if (t < RAMP_SPLIT) return lerpColor(ACCENT_SOFT_RGB, ACCENT_RGB, t / RAMP_SPLIT)
    return lerpColor(ACCENT_RGB, ACCENT_INK_RGB, (t - RAMP_SPLIT) / (1 - RAMP_SPLIT))
}

/**
 * Resolves an arc's RGBA color for the current mode and hover state. Both
 * endpoints share the color: overview pair order is canonical (not a travel
 * direction), and focus arcs encode direction via the diverging hue instead.
 * @param {Object} trip - Processed (oriented, in focus view) trip row.
 * @param {number} maxTripCount - Maximum total_daily_flow across trips.
 * @param {boolean} isFocusView - Whether a station is focused.
 * @param {string|null} hoveredCorridorKey - Corridor highlighted via panel or map hover.
 * @param {Set|null} emphasizedCorridorKeys - Ranked corridors emphasized in the overview.
 * @returns {number[]} RGBA color.
 */
function getArcColor(trip, maxTripCount, isFocusView, hoveredCorridorKey, emphasizedCorridorKeys) {
    if (trip.corridor_key === hoveredCorridorKey) return [...WARM_HIGHLIGHT_RGB, 255]
    const t = normalizeTripUsage(trip, maxTripCount)
    if (isFocusView) {
        const balanceClass = classifyBalance(trip.a_to_b_flow, trip.b_to_a_flow)
        return [...FOCUS_COLORS[balanceClass], Math.round(FOCUS_BASE_ALPHA + t * FOCUS_ALPHA_RANGE)]
    }
    let alpha = Math.round(OVERVIEW_BASE_ALPHA + t * OVERVIEW_ALPHA_RANGE)
    if (emphasizedCorridorKeys) {
        alpha = emphasizedCorridorKeys.has(trip.corridor_key)
            ? Math.max(alpha, EMPHASIS_ALPHA_FLOOR)
            : Math.round(alpha * TAIL_ALPHA_FACTOR)
    }
    return [...rampArcColor(t), alpha]
}

/**
 * Resolves an arc's width in pixels for the current mode and hover state.
 * @param {Object} trip - Processed trip row.
 * @param {number} maxTripCount - Maximum total_daily_flow across trips.
 * @param {boolean} isFocusView - Whether a station is focused.
 * @param {string|null} hoveredCorridorKey - Corridor highlighted via panel or map hover.
 * @param {Set|null} emphasizedCorridorKeys - Ranked corridors emphasized in the overview.
 * @returns {number} Width in pixels.
 */
function getArcWidth(trip, maxTripCount, isFocusView, hoveredCorridorKey, emphasizedCorridorKeys) {
    const t = normalizeTripUsage(trip, maxTripCount)
    let width = isFocusView
        ? FOCUS_BASE_WIDTH + t * FOCUS_WIDTH_RANGE
        : OVERVIEW_BASE_WIDTH + t * OVERVIEW_WIDTH_RANGE
    if (emphasizedCorridorKeys?.has(trip.corridor_key)) width += EMPHASIS_WIDTH_BONUS
    return trip.corridor_key === hoveredCorridorKey ? width + HOVER_WIDTH_BONUS : width
}

/**
 * Creates the trip-flow arc layer. Overview mode draws the citywide corridor
 * web; focus mode draws every corridor of the focused station colored by net
 * direction. Hovering a corridor (on the map or in the insights panel)
 * highlights its arc in the warm selection color.
 * @param {Array} trips - Processed trip rows (oriented to the focused station in focus view).
 * @param {number} maxTripCount - Maximum total_daily_flow, for volume scaling.
 * @param {boolean} isFocusView - Whether a station is focused.
 * @param {string|null} hoveredCorridorKey - Corridor to highlight, null for none.
 * @param {Set|null} emphasizedCorridorKeys - Ranked corridors emphasized in the overview, null for none.
 * @param {Function} onArcHover - deck.gl hover handler syncing the highlight to the panel.
 * @returns {ArcLayer} The deck.gl layer.
 */
export function createTripsArcLayer({
    trips,
    maxTripCount,
    isFocusView = false,
    hoveredCorridorKey = null,
    emphasizedCorridorKeys = null,
    onArcHover,
}) {
    // Stable trigger key so accessor caches rebuild when the ranked set changes
    const emphasisKey = emphasizedCorridorKeys ? [...emphasizedCorridorKeys].sort().join('|') : null
    return new ArcLayer({
        id: 'frequent-trips-layer',
        data: trips,
        getSourcePosition: (trip) => [trip.start_station_lon, trip.start_station_lat],
        getTargetPosition: (trip) => [trip.end_station_lon, trip.end_station_lat],
        getWidth: (trip) => getArcWidth(trip, maxTripCount, isFocusView, hoveredCorridorKey, emphasizedCorridorKeys),
        getSourceColor: (trip) => getArcColor(trip, maxTripCount, isFocusView, hoveredCorridorKey, emphasizedCorridorKeys),
        getTargetColor: (trip) => getArcColor(trip, maxTripCount, isFocusView, hoveredCorridorKey, emphasizedCorridorKeys),
        updateTriggers: {
            getWidth: [maxTripCount, isFocusView, hoveredCorridorKey, emphasisKey],
            getSourceColor: [maxTripCount, isFocusView, hoveredCorridorKey, emphasisKey],
            getTargetColor: [maxTripCount, isFocusView, hoveredCorridorKey, emphasisKey],
        },
        pickable: true,
        onHover: onArcHover,
        opacity: 1,
        widthMinPixels: 0.8,
        widthMaxPixels: isFocusView ? 7 : 6,
        widthUnits: 'pixels',
        greatCircle: false,
        parameters: {
            depthTest: false,
        },
    })
}


/**
* Generates a tooltip for trip flow data, showing the number of rides between two stations.
* @param {Object} object - The trip flow data object.
* @returns {string} The tooltip content.
*/
export function tripArcsTooltip(object) {
    const rides = Number(object.total_daily_flow) || 0
    const from = object.start_station_name
    const to = object.end_station_name
    const totalRides = Number(object.total_rides) || 0
    const a_to_b = Number(object.a_to_b_flow) || 0
    const b_to_a = Number(object.b_to_a_flow) || 0
    return `Corridor: ${from} <> ${to}\n Daily Rides: ${formatCount(rides)}\n Total Rides: ${formatCount(totalRides)}\n Daily ${from} → ${to}: ${formatNumber(a_to_b, 2)}\n Daily ${to} → ${from}: ${formatNumber(b_to_a, 2)}`
}
