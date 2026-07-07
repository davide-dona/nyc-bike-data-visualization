import { fetchStats } from '../services/statsApi.js'
import useApiQueryWithFilters from '../../../clients/baseApiQuery.js'

/**
 * Fetch per-date ride stats for the cumulative avoided-CO2 band.
 * @param {Object} filters
 * @returns Query payload and status fields.
 */
function useFootprintDaily(filters = {}) {
    const params = { ...filters, group_by: 'date' }

    const query = useApiQueryWithFilters({
        queryKey: 'footprint-daily',
        fetcher: fetchStats,
        filters: params,
    })

    return {
        dailyStats: query.data,
        loading: query.loading,
        error: query.error,
        refetch: query.refetch,
        isFetching: query.isFetching,
    }
}

export default useFootprintDaily
