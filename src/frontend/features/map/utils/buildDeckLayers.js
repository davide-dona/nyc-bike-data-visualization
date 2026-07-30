import { createBaseTileLayer } from './baseTileLayer.js'
import { createStationUsageLayer } from '../station_usage/utils/stationUsageLayer.js'
import { createTripFlowLayers } from '../trip_flow/utils/tripFlowLayer.js'
import { createStationAvailabilityLayer } from '../infrastructure/utils/stationAvailabilityLayer.js'
import { createBikeRoutesLayer } from '../infrastructure/utils/bikeRoutesLayer.js'
import { BASE_TILE_URL } from './mapConfig.js'

/**
 * Pure assembly of the deck.gl layer array for the active map layer: always
 * the base tile layer, plus the active layer's visualization when its data
 * is ready. All state arrives as explicit parameters so the function stays
 * free of hooks and trivially testable.
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
    hoveredCorridorKey,
    pinnedCorridorKey,
    emphasizedCorridorKeys,
    onTripStationPick,
    onTripStationHover,
    onTripArcHover,
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
    hoveredInfrastructureStationId,
    onInfrastructureStationPick,
    onInfrastructureStationHover,
}) {
    const base = [createBaseTileLayer(BASE_TILE_URL)]
    if (activeLayer === 'station_usage') {
        if (!stationLoading && !stationError)
            base.push(createStationUsageLayer({ frameStations, maxUsage, maxDelta }))
    }
    if (activeLayer === 'trip_flow') {
        if (!tripLoading && !tripError) {
            base.push(...createTripFlowLayers({
                trips,
                maxTripCount: maxTripFlow,
                stations: tripStations,
                focusedStationId,
                hoveredStationId: hoveredTripStationId,
                hoveredCorridorKey,
                pinnedCorridorKey,
                emphasizedCorridorKeys,
                onStationPick: onTripStationPick,
                onStationHover: onTripStationHover,
                onArcHover: onTripArcHover,
            }))
        }
    }
    if (activeLayer === 'infrastructure') {
        if (!availabilityLoading && !availabilityError) {
            // Legend toggles hide categories/classes from the map only; hasData still reads the unfiltered arrays.
            const visibleStations = hiddenHealthCategories?.size
                ? stations.filter((s) => !hiddenHealthCategories.has(s.health_category))
                : stations
            const visibleRoutes = hiddenRouteClasses?.size
                ? yearFilteredRoutes.filter((f) => !hiddenRouteClasses.has(f.facilityClass))
                : yearFilteredRoutes
            if (showBikeRoutes && visibleRoutes.length > 0) {
                base.push(createBikeRoutesLayer({ routes: visibleRoutes, hoveredrouteID: hoveredRouteId, onRoutePick }))
            }
            base.push(...createStationAvailabilityLayer({
                stations: visibleStations,
                selectedStationIds,
                hoveredStationId: hoveredInfrastructureStationId,
                onStationPick: onInfrastructureStationPick,
                onStationHover: onInfrastructureStationHover,
            }))
        }
    }

    return base
}
