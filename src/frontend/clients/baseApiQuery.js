import { useQueries, useQuery } from '@tanstack/react-query'

/** Check if filters include a valid date range (start_date and end_date) to enable the query */
function hasDateRange(filters = {}) {
    return Boolean(filters.start_date && filters.end_date)
}
/** Check if filters include user type to enable the query */
function hasUserFilters(filters = {}) {
    return Boolean(filters.user_type)
}
/**
 * Fetches data with optional filters via React Query, exposing a simplified result shape.
 * @param {Object} options.enabledWhen - Predicate on filters; defaults to a valid date range or user-type filter.
 * @param {number} [options.staleTime] - Overrides QueryClient default freshness window if set.
 * @param {number} [options.gcTime] - Overrides QueryClient default cache GC time if set.
 */
function useApiQueryWithFilters({
    queryKey,
    fetcher,
    filters = {},
    enabledWhen = filters => hasDateRange(filters) || hasUserFilters(filters),
    staleTime,
    gcTime,
    fallbackData = [],
}) {
    const enabled = enabledWhen(filters)

    const queryOptions = {
        queryKey: [queryKey, filters],
        queryFn: () => fetcher(filters),
        enabled,
        ...(staleTime !== undefined ? { staleTime } : {}),
        ...(gcTime !== undefined ? { gcTime } : {}),
    }

    const query = useQuery({
        ...queryOptions,
    })

    return {
        data: query.data ?? fallbackData,
        loading: query.isLoading,
        error: query.error?.message ?? null,
        refetch: query.refetch,
        isFetching: query.isFetching,
    }
}

/**
 * Batch variant of `useApiQueryWithFilters` for firing many parallel requests
 * (e.g. compare mode rendering one request per layer × breakdown).
 * @param {Array<object>} descriptors - Same option shape as `useApiQueryWithFilters`, one per query.
 * @returns {Array<object>} React Query result objects, one per descriptor, in order.
 */
function useApiQueriesWithFilters(descriptors = []) {
    return useQueries({
        queries: descriptors.map(({
            queryKey,
            fetcher,
            filters = {},
            enabledWhen = hasDateRange,
            staleTime,
            gcTime,
        }) => ({
            queryKey: [queryKey, filters],
            queryFn: () => fetcher(filters),
            enabled: enabledWhen(filters),
            ...(staleTime !== undefined ? { staleTime } : {}),
            ...(gcTime !== undefined ? { gcTime } : {}),
        })),
    })
}

export { useApiQueriesWithFilters }
// Re-exported so features never import @tanstack/react-query directly
export { useIsFetching } from '@tanstack/react-query'
export default useApiQueryWithFilters