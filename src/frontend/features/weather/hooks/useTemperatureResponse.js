import { fetchStatsByWeather } from "../services/statsByWeatherApi.js";
import { useApiQueriesWithFilters } from "../../../clients/baseApiQuery.js";

const USER_TYPES = ["member", "casual"];

/**
 * Fetch rides-per-hour bucketed by temperature, one series per user type so the
 * chart can contrast member and casual weather sensitivity. When the global
 * user filter is set only that type is fetched, keeping the page consistent
 * with the header filters.
 * @param {*} filters
 * @returns Series per user type plus loading/error states.
 */
function useTemperatureResponse(filters = {}) {
    const userTypes = filters.user_type ? [filters.user_type] : USER_TYPES;

    const queries = useApiQueriesWithFilters(userTypes.map((userType) => ({
        queryKey: "temperature-response",
        fetcher: fetchStatsByWeather,
        filters: { ...filters, variable: "temperature", group_by: "none", user_type: userType },
    })));

    return {
        series: userTypes.map((userType, i) => ({ userType, bins: queries[i].data ?? [] })),
        loading: queries.some((q) => q.isLoading),
        error: queries.find((q) => q.error)?.error?.message ?? null,
        refetch: () => Promise.all(queries.map((q) => q.refetch())),
    };
}

export default useTemperatureResponse;
