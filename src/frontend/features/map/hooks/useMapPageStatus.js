import { useMemo } from 'react'
import { getRouteYearBounds } from '../infrastructure/utils/routeYearFilter.js'
import { MAP_LAYER_GUIDES } from '../utils/mapGuides.js'

/**
 * Handler hook deriving the MapPage presentation state from the layer-build
 * results: year bounds for the infrastructure controls, the visibility flags
 * of the map chrome and status overlay, and the active layer's reading guide.
 * @param {Array} bikeRoutes - Bike route segments (drives the year bounds).
 * @returns {Object} yearBounds, shouldShowMapUi, shouldShowMapLegend, isAwaitingData, shouldShowStatusOverlay, and the guide.
 */
export default function useMapPageStatus({ activeLayer, loading, error, hasData, bikeRoutes }) {
    const yearBounds = useMemo(() => getRouteYearBounds(bikeRoutes), [bikeRoutes])
    const shouldShowMapUi = !error
    const shouldShowMapLegend = !loading && !error
    // No data without an in-flight query still reads as loading (e.g. before date-range filters seed).
    const isAwaitingData = !error && !hasData
    const shouldShowStatusOverlay = loading || error || isAwaitingData
    const guide = MAP_LAYER_GUIDES[activeLayer] ?? MAP_LAYER_GUIDES.station_usage

    return {
        yearBounds,
        shouldShowMapUi,
        shouldShowMapLegend,
        isAwaitingData,
        shouldShowStatusOverlay,
        guide,
    }
}
