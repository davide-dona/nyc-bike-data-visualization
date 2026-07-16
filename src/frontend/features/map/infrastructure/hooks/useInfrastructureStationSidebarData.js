import { useMemo } from 'react'
import useApiQueryWithFilters from '@/clients/baseApiQuery.js'
import { fetchInfrastructureStationSidebarData } from '../services/stationSidebarApi.js'
import { aggregateFlows, aggregateUsage, buildSummary } from '../utils/stationSidebarSelectors.js'

/**
 * Fetch hook for the infrastructure station sidebar: loads the selected
 * stations' usage and flow stats, then applies the sidebar selectors to
 * expose ready-to-render series and summary.
 * @param {Array<string>} stationIds - Selected station ids; empty disables the query.
 * @param {Object} filters - Active header filters forwarded to the API.
 * @returns {Object} Query state plus daySeries, hourSeries, totals, summary, and topFlows.
 */
export default function useInfrastructureStationSidebarData({ stationIds = [], filters = {} } = {}) {
    const queryFilters = useMemo(() => ({
        ...filters,
        stationIds,
    }), [filters, stationIds])

    const query = useApiQueryWithFilters({
        queryKey: 'infrastructure-station-sidebar-data',
        fetcher: fetchInfrastructureStationSidebarData,
        filters: queryFilters,
        enabledWhen: ({ stationIds: ids = [], start_date, end_date }) => Array.isArray(ids) && ids.length > 0 && Boolean(start_date && end_date),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        fallbackData: { items: [], selectionFilters: {} },
    })

    return useMemo(() => {
        const items = query.data?.items ?? []
        const aggregatedUsage = aggregateUsage(items)
        const aggregatedFlows = aggregateFlows(items)

        return {
            loading: query.loading,
            error: query.error,
            refetch: query.refetch,
            items,
            daySeries: aggregatedUsage.daySeries,
            hourSeries: aggregatedUsage.hourSeries,
            totals: aggregatedUsage.totals,
            summary: buildSummary(aggregatedUsage),
            topFlows: aggregatedFlows.slice(0, 6),
        }
    }, [query.data, query.error, query.loading, query.refetch])
}
