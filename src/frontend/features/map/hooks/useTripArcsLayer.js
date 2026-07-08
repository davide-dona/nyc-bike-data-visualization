import { useMemo } from 'react'
import useApiQueryWithFilters from '@/clients/baseApiQuery.js'
import { selectTrips, selectMaxFlow, orientTripsToFocus } from '../utils/tripArcsSelector.js'
import { fetchStationFlowCounts } from '../services/stationFlowCountsApi.js'
import { LIMIT_TRIPS_OVERVIEW } from '@/utils/config.js'

/**
 * Fetches and processes trip flow data for the trip flow layer. Two views
 * share the same endpoint: the citywide overview (no station filter, top
 * corridors by total rides) and the focus view (corridors of one station).
 * Both results cache independently, so leaving focus restores the overview
 * without a refetch.
 * @param {Object} filters - Optional filters such as date range or user type.
 * @param {string|null} focusedStationId - Station whose corridors to fetch, null for the overview.
 * @returns {Object} Trips (oriented to the focused station in focus view), max flow, view flag, and query states.
 */
export function useTripArcsLayer({ filters, focusedStationId }) {
    const isFocusView = Boolean(focusedStationId)

    // Citywide top corridors; the default date-range gate applies.
    const overviewQuery = useApiQueryWithFilters({
        queryKey: 'station-flow-counts',
        fetcher: fetchStationFlowCounts,
        filters: useMemo(
            () => ({ limit: LIMIT_TRIPS_OVERVIEW, ...(filters ?? {}) }),
            [filters],
        ),
    })

    // Every corridor of the focused station (no limit param, so the backend
    // returns all partner pairs); disabled while no station is focused.
    const focusQuery = useApiQueryWithFilters({
        queryKey: 'station-flow-counts',
        fetcher: fetchStationFlowCounts,
        filters: useMemo(
            () => ({ ...(filters ?? {}), station_id: focusedStationId }),
            [filters, focusedStationId],
        ),
        enabledWhen: (queryFilters) => Boolean(
            queryFilters.start_date && queryFilters.end_date && queryFilters.station_id,
        ),
    })

    const activeQuery = isFocusView ? focusQuery : overviewQuery

    // Focus view rows are oriented so start_* is always the focused station;
    // overview rows keep the backend's canonical pair order.
    const trips = useMemo(() => {
        const rows = selectTrips(activeQuery.data)
        return isFocusView ? orientTripsToFocus(rows, focusedStationId) : rows
    }, [activeQuery.data, isFocusView, focusedStationId])
    const maxTripFlow = useMemo(() => (trips.length > 0 ? selectMaxFlow(trips) : 0), [trips])

    return {
        trips,
        maxTripFlow,
        isFocusView,
        loading: activeQuery.loading,
        error: activeQuery.error,
        refetch: activeQuery.refetch,
    }
}
