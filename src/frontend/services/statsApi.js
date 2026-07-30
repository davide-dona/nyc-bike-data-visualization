import apiClient from '@/clients/apiClient.js'
import { ENDPOINTS } from '@/clients/apiConstants.js'

/** Fetches ride stats with the requested filters and group_by breakdowns (day_of_week/hour for temporal surfaces, date for footprint/line-chart series, or ungrouped totals). */
export async function fetchStats(filters = {}) {
    const { data } = await apiClient.get(ENDPOINTS.stats(), {
        params: filters,
    })
    return data
}
