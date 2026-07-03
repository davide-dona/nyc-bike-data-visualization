import { fetchStats } from '../services/statsApi.js'
import useApiQueryWithFilters from '../../../clients/baseApiQuery.js'

/**
 * Fetch the ungrouped ride totals (distance, ride count) for the stat tiles
 * and the mode comparison chart.
 * @param {*} filters
 * @returns Query payload and status fields.
 */
function useFootprintTotals(filters = {}) {
    const query = useApiQueryWithFilters({
        queryKey: 'footprint-totals',
        fetcher: fetchStats,
        filters,
        fallbackData: null,     // Ungrouped stats are a single object, not a list
    })

    return {
        totals: query.data,
        loading: query.loading,
        error: query.error,
        refetch: query.refetch,
        isFetching: query.isFetching,
    }
}

export default useFootprintTotals
