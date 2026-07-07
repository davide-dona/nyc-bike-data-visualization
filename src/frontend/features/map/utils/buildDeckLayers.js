import { createBaseTileLayer } from './baseTileLayer.js'
import { createStationUsageLayer } from './stationUsageLayer.js'
import { createTripFlowLayers } from './tripFlowLayer.js'
import { createStationAvailabilityLayer } from './stationAvailabilityLayer.js'
import { createBikeRoutesLayer } from './bikeRoutesLayer.js'
import { BASE_TILE_URL } from './mapConfig.js'

/**
 * Pure assembly of the deck.gl layer array for the active map layer: always
 * the base tile layer, plus the active layer's visualization when its data
 * is ready. All state arrives as explicit parameters so the function stays
 * free of hooks and trivially testable.
 * @param {string} activeLayer - The active map layer key.
 * @param {boolean} stationLoading - Station usage query in flight.
 * @param {any} stationError - Station usage query error.
 * @param {Array} frameStations - Stations of the current time frame.
 * @param {number} maxUsage - Usage maximum for the hexagon color scale.
 * @param {number} maxDelta - Net-flow maximum for the hexagon color scale.
 * @param {boolean} tripLoading - Trip flow query in flight.
 * @param {any} tripError - Trip flow query error.
 * @param {Array} trips - Trip flow rows (overview or focus).
 * @param {number} maxTripFlow - Flow maximum for arc width/color scaling.
 * @param {Array} tripStations - Clickable stations of the trip flow layer.
 * @param {string|null} focusedStationId - Focused station id, null in overview.
 * @param {string|null} hoveredTripStationId - Hovered trip station id.
 * @param {Function} onTripStationPick - Pick handler focusing a station.
 * @param {Function} onTripStationHover - Hover handler for trip stations.
 * @param {boolean} availabilityLoading - Station availability query in flight.
 * @param {any} availabilityError - Station availability query error.
 * @param {Array} stations - Stations with live availability data.
 * @param {Set|null} hiddenHealthCategories - Health categories hidden via the legend.
 * @param {Set|null} hiddenRouteClasses - Facility classes hidden via the legend.
 * @param {Array} yearFilteredRoutes - Bike routes active in the selected year.
 * @param {boolean} showBikeRoutes - Whether the routes overlay is enabled.
 * @param {string|null} hoveredRouteId - Hovered bike route segment id.
 * @param {Function} onRoutePick - Hover/pick handler for route segments.
 * @param {Array} selectedStationIds - Selected infrastructure station ids.
 * @param {Function} onInfrastructureStationPick - Pick handler toggling station selection.
 * @returns {Array} The deck.gl layers to render.
 */
export function buildDeckLayers({
    activeLayer,
    stationLoading,
    stationError,
    frameStations,
    maxUsage,
    maxDelta,
    tripLoading,
    tripError,
    trips,
    maxTripFlow,
    tripStations,
    focusedStationId,
    hoveredTripStationId,
    onTripStationPick,
    onTripStationHover,
    availabilityLoading,
    availabilityError,
    stations,
    hiddenHealthCategories,
    hiddenRouteClasses,
    yearFilteredRoutes,
    showBikeRoutes,
    hoveredRouteId,
    onRoutePick,
    selectedStationIds,
    onInfrastructureStationPick,
}) {
    // Base tile layer is always included
    const base = [createBaseTileLayer(BASE_TILE_URL)]
    // Push the appropriate layer based on the active layer and data loading/error states
    if (activeLayer === 'station_usage') {
        if (!stationLoading && !stationError)
            base.push(createStationUsageLayer({ frameStations, maxUsage, maxDelta }))
    }
    if (activeLayer === 'trip_flow') {
        if (!tripLoading && !tripError) {
            base.push(createTripFlowLayers({
                trips,
                maxTripCount: maxTripFlow,
                stations: tripStations,
                focusedStationId,
                hoveredStationId: hoveredTripStationId,
                onStationPick: onTripStationPick,
                onStationHover: onTripStationHover,
            }))
        }
    }
    if (activeLayer === 'infrastructure') {
        if (!availabilityLoading && !availabilityError) {
            // Legend toggles hide categories/classes from the map only; the
            // caller's hasData flags keep reading the unfiltered arrays so
            // hiding everything never re-triggers the loading overlay.
            // Route segments without a legend row (unknown class) stay visible.
            const visibleStations = hiddenHealthCategories?.size
                ? stations.filter((s) => !hiddenHealthCategories.has(s.health_category))
                : stations
            const visibleRoutes = hiddenRouteClasses?.size
                ? yearFilteredRoutes.filter((f) => !hiddenRouteClasses.has(f.facilityClass))
                : yearFilteredRoutes
            if (showBikeRoutes && visibleRoutes.length > 0) {
                base.push(createBikeRoutesLayer({ routes: visibleRoutes, hoveredrouteID: hoveredRouteId, onRoutePick }))
            }
            base.push(createStationAvailabilityLayer({
                stations: visibleStations,
                selectedStationIds,
                onStationPick: onInfrastructureStationPick,
            }))
        }
    }

    return base
}
