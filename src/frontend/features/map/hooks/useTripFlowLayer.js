import { useInfrastructureLayer } from "./useInfrastructureLayer.js";
import { useTripArcsLayer } from "./useTripArcsLayer.js";

/**
 * Custom hook to fetch and process data for the trip flow layer, including station availability and trip arcs.
 * It combines the data from station availability and trip arcs to provide a comprehensive dataset for the trip flow visualization.
 * @param {Object} filters - Optional filters for fetching trip counts, such as date range or user-selected filters.
 * @param {string|null} focusedStationId - Focused station id, null for the citywide overview.
 * @param {'all'|'incoming'|'outgoing'} [tripDirection='all'] - Direction filter, applied in focus view only.
 * @returns {Object} Trips, max flow, view flag, clickable stations, and combined query states.
 */
export function useTripFlowLayer({ filters, focusedStationId, tripDirection = 'all' }) {
    // Data fetching for station availability and trip arcs
    const { stations: stationData, loading: stationLoading, error: stationError, refetch: refetchStations } = useInfrastructureLayer({ showBikeRoutes: false })
    const { trips, maxTripFlow, isFocusView, loading: tripLoading, error: tripError, refetch: refetchTrips } = useTripArcsLayer({ filters, focusedStationId, tripDirection })
    // Combine loading and error states for easier handling in the component
    const loading = stationLoading || tripLoading
    const error = stationError || tripError
    const refetch = () => Promise.all([refetchStations(), refetchTrips()])
    // Return combined data and states for the trip flow layer
    return { trips, maxTripFlow, isFocusView, stations: stationData, loading, error, refetch }
}
