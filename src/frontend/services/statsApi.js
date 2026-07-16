import apiClient from '@/clients/apiClient.js'
import { ENDPOINTS } from '@/clients/apiConstants.js'

/**
 * Fetches ride stats with the requested filters and group_by breakdowns
 * (day_of_week/hour for the temporal surfaces, date for the footprint and
 * line-chart series, or ungrouped totals).
 * @param {Object} filters - Query filters, including optional group_by fields.
 * @returns {Promise<Object>} The stats payload.
 */
export async function fetchStats(filters = {}) {
    const { data } = await apiClient.get(ENDPOINTS.stats(), {
        params: filters,
    })
    return data
}
