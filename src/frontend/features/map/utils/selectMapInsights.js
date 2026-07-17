/**
 * Pure assembly of the per-layer data slices for the insights panel under
 * the map. The caller memoizes the result as one stable bundle so consumers
 * can depend on it without new object identities leaking into other hooks'
 * dependency arrays every render.
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
