/**
 * Pure assembly of the per-layer data slices for the insights panel under
 * the map. The caller memoizes the result as one stable bundle so consumers
 * can depend on it without new object identities leaking into other hooks'
 * dependency arrays every render.
 * @param {Array} usageStations - Full station usage series.
 * @param {boolean} stationLoading - Station usage query in flight.
 * @param {any} stationError - Station usage query error.
 * @param {Function} stationRefetch - Refetches station usage.
 * @param {Array} trips - Trip flow rows (overview or focus).
 * @param {boolean} isFocusView - Whether a station is focused.
 * @param {string|null} focusedStationName - Name of the focused station.
 * @param {boolean} tripLoading - Trip flow query in flight.
 * @param {any} tripError - Trip flow query error.
 * @param {Function} tripRefetch - Refetches trip flow.
 * @param {Array} bikeRoutes - Unfiltered bike routes (full history).
 * @param {Array} yearFilteredRoutes - Routes active in the selected year.
 * @param {boolean} routesLoading - Bike routes query in flight.
 * @param {any} routesError - Bike routes query error.
 * @param {Function} refetchRoutes - Refetches bike routes.
 * @returns {Object} stationUsage, tripFlow, and infrastructure insight slices.
 */
export function selectMapInsights({
    usageStations,
    stationLoading,
    stationError,
    stationRefetch,
    trips,
    isFocusView,
    focusedStationName,
    tripLoading,
    tripError,
    tripRefetch,
    bikeRoutes,
    yearFilteredRoutes,
    routesLoading,
    routesError,
    refetchRoutes,
}) {
    return {
        stationUsage: {
            stations: usageStations,
            loading: stationLoading,
            error: stationError,
            refetch: stationRefetch,
        },
        tripFlow: {
            trips,
            isFocusView,
            focusedStationName,
            loading: tripLoading,
            error: tripError,
            refetch: tripRefetch,
        },
        infrastructure: {
            routes: bikeRoutes,
            yearFilteredRoutes,
            // Route-only states, so the panel works while showBikeRoutes is off
            loading: routesLoading,
            error: routesError,
            refetch: refetchRoutes,
        },
    }
}
