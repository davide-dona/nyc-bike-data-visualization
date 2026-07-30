import { fetchStationAvailability } from '../services/stationAvailabilityApi.js'
import useApiQueryWithFilters from '@/clients/baseApiQuery.js'

/**
 * Fetches live station availability data (bikes/docks per station).
 * @returns {Object} stationData, loading, refetch, and error.
 */
export default function useStationAvailability() {
    const query = useApiQueryWithFilters({
        queryKey: 'station-availability',
        fetcher: fetchStationAvailability,
        // Always enable this query since it doesn't depend on user-provided filters
        enabledWhen: () => true,
        // Lower staleTime/gcTime since station availability is updated live
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    })

    return {
        stationData: query.data,
        loading: query.loading,
        refetch : query.refetch,
        error: query.error,
    }
}