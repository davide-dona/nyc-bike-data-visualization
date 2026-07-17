import apiClient from '@/clients/apiClient.js'
import { ENDPOINTS } from '@/clients/apiConstants.js'

/**
 * Fetches station availability data (station id, available bikes, empty docks) from the backend.
 * @returns {Promise<Array>} Station availability rows.
 */
export async function fetchStationAvailability() {
    const { data } = await apiClient.get(ENDPOINTS.stationsAvailability())
    return data
}