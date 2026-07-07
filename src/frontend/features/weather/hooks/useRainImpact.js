import { fetchStatsByWeather } from "../services/statsByWeatherApi.js";
import useApiQueryWithFilters from "../../../clients/baseApiQuery.js";

/**
 * Fetch rides-per-hour bucketed by precipitation intensity for the rain impact chart.
 * @param {Object} filters
 * @returns Query payload and status fields.
 */
function useRainImpact(filters = {}) {
    const params = { ...filters, variable: "precipitation", group_by: "none" };

    const query = useApiQueryWithFilters({
        queryKey: "rain-impact",
        fetcher: fetchStatsByWeather,
        filters: params,
    });

    return {
        rainStats: query.data,
        loading: query.loading,
        error: query.error,
        refetch: query.refetch,
        isFetching: query.isFetching,
    };
}

export default useRainImpact;
