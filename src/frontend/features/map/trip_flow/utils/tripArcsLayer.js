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
import { RIDE_METRIC_LABELS } from '@/utils/rideMetricLabels.js'

// Overview: thin translucent arcs by volume (width/opacity/hue ramp); focus: solid diverging colors by net direction, volume drives width/opacity.
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
// Overview emphasis: ranked corridors get an opacity floor and width bonus; the long tail is dimmed.
const EMPHASIS_ALPHA_FLOOR = 210
const EMPHASIS_WIDTH_BONUS = 1.5
const TAIL_ALPHA_FACTOR = 0.4
// Corridor pin (leaderboard click): only the pinned corridor's arc is drawn, so it always gets full opacity.

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
 * Applies the corridor-pin treatment: the pinned corridor is always full opacity. Non-pinned
 * corridors are excluded from the layer's data entirely (see createTripsArcLayer), so by the
 * time this runs every trip already matches the pin.
 * @param {Object} trip - Processed trip row.
 * @param {string|null} pinnedCorridorKey - Pinned corridor key, null for none.
 * @param {number} alpha - The alpha computed for the current mode.
 * @returns {number} The pin-adjusted alpha.
 */
function applyPinAlpha(trip, pinnedCorridorKey, alpha) {
    if (!pinnedCorridorKey) return alpha
    return 255
}

/**
 * Resolves an arc's RGBA color for the current mode, hover, and pin state. Both
 * endpoints share the color: overview pair order is canonical, focus encodes direction via hue.
 * @param {Object} trip - Processed (oriented, in focus view) trip row.
 * @param {number} maxTripCount - Maximum total_daily_flow across trips.
 * @param {boolean} isFocusView - Whether a station is focused.
 * @param {string|null} hoveredCorridorKey - Corridor highlighted via panel or map hover.
 * @param {string|null} pinnedCorridorKey - Corridor pinned via a leaderboard click.
 * @param {Set|null} emphasizedCorridorKeys - Ranked corridors emphasized in the overview.
 * @returns {number[]} RGBA color.
 */
function getArcColor(trip, maxTripCount, isFocusView, hoveredCorridorKey, pinnedCorridorKey, emphasizedCorridorKeys) {
    if (trip.corridor_key === hoveredCorridorKey) return [...WARM_HIGHLIGHT_RGB, 255]
    const t = normalizeTripUsage(trip, maxTripCount)
    if (isFocusView) {
        const balanceClass = classifyBalance(trip.a_to_b_flow, trip.b_to_a_flow)
        const alpha = Math.round(FOCUS_BASE_ALPHA + t * FOCUS_ALPHA_RANGE)
        return [...FOCUS_COLORS[balanceClass], applyPinAlpha(trip, pinnedCorridorKey, alpha)]
    }
    let alpha = Math.round(OVERVIEW_BASE_ALPHA + t * OVERVIEW_ALPHA_RANGE)
    if (emphasizedCorridorKeys) {
        alpha = emphasizedCorridorKeys.has(trip.corridor_key)
            ? Math.max(alpha, EMPHASIS_ALPHA_FLOOR)
            : Math.round(alpha * TAIL_ALPHA_FACTOR)
    }
    return [...rampArcColor(t), applyPinAlpha(trip, pinnedCorridorKey, alpha)]
}

/**
 * Resolves an arc's width in pixels for the current mode, hover, and pin state.
 * @param {Object} trip - Processed trip row.
 * @param {number} maxTripCount - Maximum total_daily_flow across trips.
 * @param {boolean} isFocusView - Whether a station is focused.
 * @param {string|null} hoveredCorridorKey - Corridor highlighted via panel or map hover.
 * @param {string|null} pinnedCorridorKey - Corridor pinned via a leaderboard click.
 * @param {Set|null} emphasizedCorridorKeys - Ranked corridors emphasized in the overview.
 * @returns {number} Width in pixels.
 */
function getArcWidth(trip, maxTripCount, isFocusView, hoveredCorridorKey, pinnedCorridorKey, emphasizedCorridorKeys) {
    const t = normalizeTripUsage(trip, maxTripCount)
    let width = isFocusView
        ? FOCUS_BASE_WIDTH + t * FOCUS_WIDTH_RANGE
        : OVERVIEW_BASE_WIDTH + t * OVERVIEW_WIDTH_RANGE
    if (emphasizedCorridorKeys?.has(trip.corridor_key)) width += EMPHASIS_WIDTH_BONUS
    if (trip.corridor_key === pinnedCorridorKey) width += EMPHASIS_WIDTH_BONUS
    return trip.corridor_key === hoveredCorridorKey ? width + HOVER_WIDTH_BONUS : width
}

/**
 * Creates the trip-flow arc layer. Overview mode draws the citywide corridor web; focus mode
 * draws every corridor of the focused station colored by net direction. Hovering a corridor
 * (map or panel) highlights its arc in the warm selection color.
 * @param {Array} trips - Processed trip rows (oriented to the focused station in focus view).
 * @param {number} maxTripCount - Maximum total_daily_flow, for volume scaling.
 * @param {boolean} isFocusView - Whether a station is focused.
 * @param {string|null} hoveredCorridorKey - Corridor to highlight, null for none.
 * @param {string|null} pinnedCorridorKey - Corridor pinned via a leaderboard click, null for none. When
 *   set, only that corridor's arc(s) are drawn — the rest are hidden, not just dimmed.
 * @param {Set|null} emphasizedCorridorKeys - Ranked corridors emphasized in the overview, null for none.
 * @param {Function} onArcHover - deck.gl hover handler syncing the highlight to the panel.
 * @returns {ArcLayer} The deck.gl layer.
 */
export function createTripsArcLayer({
    trips,
    maxTripCount,
    isFocusView = false,
    hoveredCorridorKey = null,
    pinnedCorridorKey = null,
    emphasizedCorridorKeys = null,
    onArcHover,
}) {
    // Stable trigger key so accessor caches rebuild when the ranked set changes
    const emphasisKey = emphasizedCorridorKeys ? [...emphasizedCorridorKeys].sort().join('|') : null
    // A pinned corridor hides every other arc: filter the data (not just dim) so non-pinned arcs leave picking too.
    const visibleTrips = pinnedCorridorKey
        ? trips.filter((trip) => trip.corridor_key === pinnedCorridorKey)
        : trips
    return new ArcLayer({
        id: 'frequent-trips-layer',
        data: visibleTrips,
        getSourcePosition: (trip) => [trip.start_station_lon, trip.start_station_lat],
        getTargetPosition: (trip) => [trip.end_station_lon, trip.end_station_lat],
        getWidth: (trip) => getArcWidth(trip, maxTripCount, isFocusView, hoveredCorridorKey, pinnedCorridorKey, emphasizedCorridorKeys),
        getSourceColor: (trip) => getArcColor(trip, maxTripCount, isFocusView, hoveredCorridorKey, pinnedCorridorKey, emphasizedCorridorKeys),
        getTargetColor: (trip) => getArcColor(trip, maxTripCount, isFocusView, hoveredCorridorKey, pinnedCorridorKey, emphasizedCorridorKeys),
        updateTriggers: {
            getWidth: [maxTripCount, isFocusView, hoveredCorridorKey, pinnedCorridorKey, emphasisKey],
            getSourceColor: [maxTripCount, isFocusView, hoveredCorridorKey, pinnedCorridorKey, emphasisKey],
            getTargetColor: [maxTripCount, isFocusView, hoveredCorridorKey, pinnedCorridorKey, emphasisKey],
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
    const from = object.start_station_name;
    const to = object.end_station_name;
    
    const dailyTotal = Number(object.total_daily_flow) || 0;
    const netTotal = Number(object.total_rides) || 0;
    
    const outFlow = Number(object.a_to_b_flow) || 0;
    const inFlow = Number(object.b_to_a_flow) || 0;

    return `Corridor\n${from} ↔ ${to}\n\nTraffic Volume\n - ${RIDE_METRIC_LABELS.perDay.label}: ${formatCount(dailyTotal)}\n - ${RIDE_METRIC_LABELS.total.label}: ${formatCount(netTotal)}\n\nDirection Flow(Daily)\n - To ${to}: ${formatNumber(outFlow, 2)}\n - To ${from}: ${formatNumber(inFlow, 2)}`;
}