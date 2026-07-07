import { createTripStationsHitLayer, createTripStationsLayer } from "./tripStationsLayer.js";
import { createTripsArcLayer } from "./tripArcsLayer.js";

/**
 * Creates the layers for visualizing trip flows between stations, including arcs for trips and points for stations.
 * @param {Array} trips - Array of trip objects with source and target positions and daily flow
 * @param {number} maxTripCount - Maximum trip count for scaling arc widths and colors
 * @param {Array} stations - Array of station objects with latitude and longitude for displaying station points
 * @param {string|null} focusedStationId - Focused station identifier, null in the citywide overview.
 * @param {Function} onStationPick - Click handler that focuses the picked station.
 * @returns
 */
export function createTripFlowLayers({
    trips,
    maxTripCount,
    stations,
    focusedStationId = null,
    hoveredStationId = null,
    onStationPick,
    onStationHover,
}) {
    const layers = []
    layers.push(createTripsArcLayer({ trips, maxTripCount }))
    layers.push(createTripStationsLayer({
        stations,
        focusedStationId,
        hoveredStationId,
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
 */
export function tripFlowLegend() {
    return {
        entries: [
            { swatch: 'rgb(25, 83, 216)', label: 'Trip source' },
            { swatch: 'rgb(10, 42, 122)', label: 'Trip target' },
            { swatch: 'rgb(229, 140, 43)', label: 'Focused station' },
        ],
    }
}
