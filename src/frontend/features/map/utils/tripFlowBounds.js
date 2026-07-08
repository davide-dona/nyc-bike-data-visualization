import { WebMercatorViewport } from '@deck.gl/core'
import { MIN_ZOOM } from './mapConfig.js'

// Share of total daily flow the framed corridors must cover. Excluding the
// long tail keeps one or two far-away partners from zooming the camera out
// to the whole city.
const DEFAULT_COVERAGE = 0.9
// Pixel padding around the fitted bounds.
const FIT_PADDING = 80
// Zoom-in ceiling for the fitted view, so stations whose corridors are all
// adjacent still show a readable neighborhood rather than one block.
const MAX_FIT_ZOOM = 14

/**
 * Computes the geographic bounds of a focused station's strongest corridors:
 * the smallest set (by descending daily flow) covering the given share of
 * total flow, always including the focused start endpoint.
 * @param {Array} orientedTrips - Trip rows oriented so start_* is the focused station.
 * @param {Object} [options] - Options.
 * @param {number} [options.coverage] - Share of total daily flow to cover, in (0, 1].
 * @returns {Array|null} [[minLng, minLat], [maxLng, maxLat]], or null when there are no rows.
 */
export function computeFocusBounds(orientedTrips, { coverage = DEFAULT_COVERAGE } = {}) {
    const rows = (orientedTrips ?? []).filter((trip) => Number.isFinite(trip.total_daily_flow))
    if (rows.length === 0) return null

    const sorted = [...rows].sort((a, b) => b.total_daily_flow - a.total_daily_flow)
    const totalFlow = sorted.reduce((sum, trip) => sum + trip.total_daily_flow, 0)

    let minLng = sorted[0].start_station_lon
    let maxLng = sorted[0].start_station_lon
    let minLat = sorted[0].start_station_lat
    let maxLat = sorted[0].start_station_lat
    const extend = (lon, lat) => {
        minLng = Math.min(minLng, lon)
        maxLng = Math.max(maxLng, lon)
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
    }

    let coveredFlow = 0
    for (const trip of sorted) {
        if (totalFlow > 0 && coveredFlow >= coverage * totalFlow) break
        coveredFlow += trip.total_daily_flow
        extend(trip.start_station_lon, trip.start_station_lat)
        extend(trip.end_station_lon, trip.end_station_lat)
    }

    return [[minLng, minLat], [maxLng, maxLat]]
}

/**
 * Resolves the camera target that frames the given bounds inside a viewport,
 * clamping zoom to the allowed range for a fitted view.
 * @param {Array} bounds - [[minLng, minLat], [maxLng, maxLat]].
 * @param {Object} viewport - Viewport size.
 * @param {number} viewport.width - Viewport width in pixels.
 * @param {number} viewport.height - Viewport height in pixels.
 * @returns {{longitude: number, latitude: number, zoom: number}} Camera target for flyTo.
 */
export function fitViewForBounds(bounds, { width, height }) {
    const { longitude, latitude, zoom } = new WebMercatorViewport({ width, height })
        .fitBounds(bounds, { padding: FIT_PADDING })
    return {
        longitude,
        latitude,
        zoom: Math.min(Math.max(zoom, MIN_ZOOM), MAX_FIT_ZOOM),
    }
}
