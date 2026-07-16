import { createTripStationsLayers } from "./tripStationsLayer.js";
import { createTripsArcLayer } from "./tripArcsLayer.js";
import { formatCount } from "@/utils/numberFormat.js";

/**
 * Creates the layers for visualizing trip flows between stations, including arcs for trips and points for stations.
 * Render order: station halo and dots first (under the arcs so the corridor
 * web stays readable), then the arcs, then the invisible station hit layer
 * last so station clicks and hovers keep winning the pick over the arcs.
 * @param {Array} trips - Array of trip objects with source and target positions and daily flow
 * @param {number} maxTripCount - Maximum trip count for scaling arc widths and colors
 * @param {Array} stations - Array of station objects with latitude and longitude for displaying station points
 * @param {string|null} focusedStationId - Focused station identifier, null in the citywide overview.
 * @param {string|null} hoveredStationId - Hovered station identifier.
 * @param {string|null} hoveredCorridorKey - Corridor highlighted via panel or arc hover.
 * @param {string|null} pinnedCorridorKey - Corridor pinned via a leaderboard click, null for none.
 * @param {Set|null} emphasizedCorridorKeys - Ranked corridors emphasized in the overview.
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
    pinnedCorridorKey = null,
    emphasizedCorridorKeys = null,
    onStationPick,
    onStationHover,
    onArcHover,
}) {
    const isFocusView = Boolean(focusedStationId)
    const stationLayers = createTripStationsLayers({
        stations,
        focusedStationId,
        hoveredStationId,
        isFocusView,
        onStationPick,
        onStationHover,
    })
    // The hovered-dot overlay and the invisible hit layer must stay on top of
    // the arcs: the hit layer so arcs never steal station clicks (deck.gl
    // picks the topmost rendered pixel and every trip-flow layer disables
    // depth test), the hover overlay so the hover feedback is not buried
    // under a dense corridor web.
    const stationTopLayers = stationLayers.filter(
        (layer) => layer.id.endsWith('-hit') || layer.id.endsWith('-hover'),
    )
    const stationBaseLayers = stationLayers.filter(
        (layer) => !stationTopLayers.includes(layer),
    )

    return [
        ...stationBaseLayers,
        createTripsArcLayer({
            trips,
            maxTripCount,
            isFocusView,
            hoveredCorridorKey,
            pinnedCorridorKey,
            emphasizedCorridorKeys: isFocusView ? null : emphasizedCorridorKeys,
            onArcHover,
        }),
        ...stationTopLayers,
    ]
}

/**
 * Returns the legend entries for the trip-flow layer as plain data.
 * `MapLegend` renders them uniformly alongside every other layer's entries.
 * The overview legend explains the volume ramp with the actual daily-rides
 * bounds of the corridors on the map; the focus legend explains the
 * diverging net-direction colors.
 * @param {boolean} isFocusView - Whether a station is focused.
 * @param {{minFlow: number, maxFlow: number}|null} flowBounds - Daily-flow bounds of the drawn corridors.
 * @returns {Object} Legend entries for the current mode.
 */
export function tripFlowLegend(isFocusView = false, flowBounds = null) {
    if (isFocusView) {
        return {
            entries: [
                { swatch: 'rgb(25, 83, 216)', label: 'More departures' },
                { swatch: 'rgb(194, 80, 26)', label: 'More arrivals' },
                { swatch: 'rgb(110, 106, 98)', label: 'Neutral' },
            ],
        }
    }
    const volumeLabel = 'Corridor volume (low to high)'
    return {
        entries: [
            {
                swatch: 'linear-gradient(90deg, rgb(184, 201, 236), rgb(25, 83, 216))',
                label: volumeLabel,
            },
        ],
    }
}
