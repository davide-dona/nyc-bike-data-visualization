import { ArcLayer } from '@deck.gl/layers'
import {
    ACCENT_RGB,
    ACCENT_INK_RGB,
} from '@/utils/editorialTokens.js'
import { formatCount, formatNumber } from '@/utils/numberFormat.js'

// Arc styling - alpha and width ramps stay; palette is editorial.
const BASE_ALPHA = 80
const MAX_ALPHA_RANGE = 175
const BASE_WIDTH = 3
const MAX_WIDTH_RANGE = 20
const SOURCE_COLOR = ACCENT_RGB            // [25, 83, 216]
const TARGET_COLOR = ACCENT_INK_RGB        // [10, 42, 122]

/**
 * Normalizes trip usage to a 0–1 range
 * @param {Object} trip 
 * @param {number} maxTripCount 
 * @returns {number}
 */
function normalizeTripUsage(trip, maxTripCount) {
    return (Number(trip.total_daily_flow) || 0) / maxTripCount
}

/**
 * Computes arc width based on normalized usage
 * @param {number} normalizedUsage 
 * @returns {number} arc width in pixels
 */
function getArcWidth(normalizedUsage) {
    return BASE_WIDTH + normalizedUsage * MAX_WIDTH_RANGE
}

/**
 * Computes arc color with alpha based on normalized usage
 * @param {number[]} baseColor - RGB triplet
 * @param {number} normalizedUsage 
 * @returns {number[]} - RGBA array
 */
function getArcColor(baseColor, normalizedUsage) {
    const alpha = Math.round(BASE_ALPHA + normalizedUsage * MAX_ALPHA_RANGE)
    return [...baseColor, alpha]
}

/**
 * Creates a layer for displaying frequent trips based on their usage
 * @param {Array} trips - Array of trip objects with sourcePosition, targetPosition, and dailyFlow
 * @param {number} maxTripCount - Maximum trip count for scaling widths and colors
 * @returns {ArcLayer}
 */
export function createTripsArcLayer({ trips, maxTripCount }) {
    return new ArcLayer({
        id: 'frequent-trips-layer',
        data: trips,
        getSourcePosition: (trip) => [trip.start_station_lon, trip.start_station_lat],
        getTargetPosition: (trip) => [trip.end_station_lon, trip.end_station_lat],
        getWidth: (trip) => getArcWidth(normalizeTripUsage(trip, maxTripCount)),
        getSourceColor: (trip) => getArcColor(SOURCE_COLOR, normalizeTripUsage(trip, maxTripCount)),
        getTargetColor: (trip) => getArcColor(TARGET_COLOR, normalizeTripUsage(trip, maxTripCount)),
        updateTriggers: {
            getWidth: [maxTripCount],
            getSourceColor: [maxTripCount],
            getTargetColor: [maxTripCount],
        },
        pickable: true,
        opacity: 0.75,
        widthMinPixels: 1,
        widthMaxPixels: 8,
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

