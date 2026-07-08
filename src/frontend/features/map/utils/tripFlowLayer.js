import { createTripStationsHitLayer, createTripStationsLayer } from "./tripStationsLayer.js";
import { createTripsArcLayer } from "./tripArcsLayer.js";

/**
 * Creates the layers for visualizing trip flows between stations, including arcs for trips and points for stations.
 * @param {Array} trips - Array of trip objects with source and target positions and daily flow
 * @param {number} maxTripCount - Maximum trip count for scaling arc widths and colors
 * @param {Array} stations - Array of station objects with latitude and longitude for displaying station points
 * @param {string|null} focusedStationId - Focused station identifier, null in the citywide overview.
 * @param {string|null} hoveredStationId - Hovered station identifier.
 * @param {string|null} hoveredCorridorKey - Corridor highlighted via panel or arc hover.
 * @param {Function} onStationPick - Click handler that focuses the picked station.
 * @param {Function} onStationHover - Hover handler for station dots.
 * @param {Function} onArcHover - Hover handler for corridor arcs.
 * @returns {Array} The trip-flow deck.gl layers.
 */
export function createTripFlowLayers({
    trips,
    maxTripCount,
    stations,
    focusedStationId = null,
    hoveredStationId = null,
    hoveredCorridorKey = null,
    onStationPick,
    onStationHover,
    onArcHover,
}) {
    const isFocusView = Boolean(focusedStationId)
    const layers = []
    layers.push(createTripsArcLayer({
        trips,
        maxTripCount,
        isFocusView,
        hoveredCorridorKey,
        onArcHover,
    }))
    layers.push(createTripStationsLayer({
        stations,
        focusedStationId,
        hoveredStationId,
        isFocusView,
    }))
    layers.push(createTripStationsHitLayer({
        stations,
        hoveredStationId,
        onStationPick,
        onStationHover,
    }))
    return layers
}

/**
 * Returns the legend entries for the trip-flow layer as plain data.
 * `MapLegend` renders them uniformly alongside every other layer's entries.
 * The overview legend explains the volume ramp; the focus legend explains
 * the diverging net-direction colors.
 * @param {boolean} isFocusView - Whether a station is focused.
 * @returns {Object} Legend entries for the current mode.
 */
export function tripFlowLegend(isFocusView = false) {
    if (isFocusView) {
        return {
            entries: [
                { swatch: 'rgb(25, 83, 216)', label: 'Net outbound' },
                { swatch: 'rgb(194, 80, 26)', label: 'Net inbound' },
                { swatch: 'rgb(110, 106, 98)', label: 'Balanced' },
                { swatch: 'rgb(229, 140, 43)', label: 'Focused station' },
            ],
        }
    }
    return {
        entries: [
            {
                swatch: 'linear-gradient(90deg, rgb(184, 201, 236), rgb(25, 83, 216), rgb(10, 42, 122))',
                label: 'Corridor volume (low → high)',
            },
            { swatch: 'rgba(110, 106, 98, 0.6)', label: 'Station' },
        ],
    }
}
