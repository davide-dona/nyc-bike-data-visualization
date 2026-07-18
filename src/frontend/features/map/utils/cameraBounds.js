import { WebMercatorViewport } from '@deck.gl/core'
import { MIN_ZOOM } from './mapConfig.js'

// Pixel padding around the fitted bounds.
const FIT_PADDING = 80
// Zoom-in ceiling for fitted views, so tightly clustered targets still show a readable neighborhood, not one block.
export const MAX_FIT_ZOOM = 14

/**
 * Computes the geographic bounds of a set of stations.
 * @param {Array} stations - Stations with latitude and longitude.
 * @returns {Array|null} [[minLng, minLat], [maxLng, maxLat]], or null when empty.
 */
export function computeStationsBounds(stations) {
    const rows = (stations ?? []).filter(
        (station) => Number.isFinite(station.longitude) && Number.isFinite(station.latitude),
    )
    if (rows.length === 0) return null

    let minLng = rows[0].longitude
    let maxLng = rows[0].longitude
    let minLat = rows[0].latitude
    let maxLat = rows[0].latitude
    for (const station of rows) {
        minLng = Math.min(minLng, station.longitude)
        maxLng = Math.max(maxLng, station.longitude)
        minLat = Math.min(minLat, station.latitude)
        maxLat = Math.max(maxLat, station.latitude)
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
