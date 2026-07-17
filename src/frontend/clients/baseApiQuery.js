import { useQueries, useQuery } from '@tanstack/react-query'

/** Check if filters include a valid date range (start_date and end_date) to enable the query */
function hasDateRange(filters = {}) {
    return Boolean(filters.start_date && filters.end_date)
}
/** Check if filters include user type to enable the query */
function hasUserFilters(filters = {}) {
    return Boolean(filters.user_type)
}
/** Fetches data with optional filters via React Query, exposing a simplified result shape. */
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

/** Batch variant of `useApiQueryWithFilters` for firing many parallel requests (e.g. compare mode). */
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