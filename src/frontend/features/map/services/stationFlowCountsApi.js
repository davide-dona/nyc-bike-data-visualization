import apiClient from '@/clients/apiClient.js'
import { ENDPOINTS } from '@/clients/apiConstants.js'
import { toStationParams } from '../utils/stationParam.js'

/**
 * Fetches most frequent trips between station pairs, with optional filters
 * @param {Object} filters
 * @returns An array of station-pair trip counts grouped by time buckets
 */
export async function fetchStationFlowCounts(filters = {}) {
    const { data } = await apiClient.get(ENDPOINTS.stationFlowCounts(), {
        params: toStationParams(filters),
    })
    return data
}