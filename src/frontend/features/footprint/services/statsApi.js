import apiClient from '../../../clients/apiClient.js'
import { ENDPOINTS } from '../../../clients/apiConstants.js'

/**
 * Fetches ride stats for the footprint view, either ungrouped totals or a
 * per-date series depending on the group_by filter.
 * @param {*} filters
 * @returns
 */
export async function fetchStats(filters = {}) {
    const { data } = await apiClient.get(ENDPOINTS.stats(), {
        params: filters,
    })
    return data
}
