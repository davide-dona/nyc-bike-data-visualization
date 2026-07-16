import { useMemo } from 'react'
import { getRouteYearBounds } from '../utils/routeYearFilter.js'
import { MAP_LAYER_GUIDES } from '../utils/mapGuides.js'

/**
 * Handler hook deriving the MapPage presentation state from the layer-build
 * results: year bounds for the infrastructure controls, the visibility flags
 * of the map chrome and status overlay, and the active layer's reading guide.
 * @param {string} activeLayer - The currently active map layer.
 * @param {boolean} loading - Whether the active layer's data is loading.
 * @param {any} error - Fetch error of the active layer, if any.
 * @param {boolean} hasData - Whether the active layer has data to draw.
 * @param {Array} bikeRoutes - Bike route segments (drives the year bounds).
 * @returns {Object} yearBounds, shouldShowMapUi, shouldShowMapLegend, isAwaitingData, shouldShowStatusOverlay, and the guide.
 */
export default function useMapPageStatus({ activeLayer, loading, error, hasData, bikeRoutes }) {
    const yearBounds = useMemo(() => getRouteYearBounds(bikeRoutes), [bikeRoutes])
    const shouldShowMapUi = !error
    const shouldShowMapLegend = !loading && !error
    // Data can also be "not ready yet" without a query in flight (e.g. before
    // the date range seeds the filters), so missing data reads as loading
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
