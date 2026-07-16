import apiClient from '@/clients/apiClient.js'
import { ENDPOINTS } from '@/clients/apiConstants.js'
import { toStationParams } from '../../utils/stationParam.js'

/**
 * Fetches usage counts for each station, with optional filters.
 * @param {Object} filters
 * @returns An array of station usage counts.
 */
export async function fetchStationUsageCounts(filters = {}) {
    const params = { ...toStationParams(filters), group_by: 'hour' }
    const { data } = await apiClient.get(ENDPOINTS.stationUsageCounts(), {
        params,
    })
    return data
}

