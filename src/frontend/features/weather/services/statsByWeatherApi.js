import apiClient from '../../../clients/apiClient.js'
import { ENDPOINTS } from '../../../clients/apiConstants.js'

/**
 * Fetches stats grouped by weather conditions, used for surface graph rendering.
 */
export async function fetchStatsByWeather(filters = {}) {
    const { data } = await apiClient.get(ENDPOINTS.statsByWeather(), {
        params: filters,
    })
    return data
}