import { useMemo } from "react";
import useStationAvailability from "../../hooks/useStationAvailability.js";
import { selectStationAvailability } from "../../infrastructure/utils/stationAvailabilitySelector.js";
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
    // Only station coordinates are needed here, so this uses the station-availability
    // hook directly instead of the whole infrastructure layer (which also fetches bike routes).
    const { stationData, loading: stationLoading, error: stationError, refetch: refetchStations } = useStationAvailability()
    const stations = useMemo(() => selectStationAvailability(stationData), [stationData])
    const { trips, maxTripFlow, isFocusView, loading: tripLoading, error: tripError, refetch: refetchTrips } = useTripArcsLayer({ filters, focusedStationId, tripDirection })
    const loading = stationLoading || tripLoading
    const error = stationError || tripError
    const refetch = () => Promise.all([refetchStations(), refetchTrips()])
    return { trips, maxTripFlow, isFocusView, stations, loading, error, refetch }
}
