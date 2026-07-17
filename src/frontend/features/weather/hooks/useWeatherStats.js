import { fetchStatsByWeather } from "../services/statsByWeatherApi.js";
import useApiQueryWithFilters from "../../../clients/baseApiQuery.js";

/**
 * Fetches stats grouped by weather, used for surface graph rendering.
 * @returns Weather stats data and loading/error states.
 */
function useWeatherStats(filters={}) {
    const params = { ...filters}

    const query = useApiQueryWithFilters({
        queryKey: 'weather-stats',
        fetcher: fetchStatsByWeather,
        filters: params,
    })

    return {
        weatherStats: query.data,
        loading: query.loading,
        error: query.error,
        refetch: query.refetch,
        isFetching: query.isFetching,
    }
}

export default useWeatherStats  