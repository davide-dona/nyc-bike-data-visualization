import apiClient from '../../../clients/apiClient.js'
import { ENDPOINTS } from '../../../clients/apiConstants.js'

/**
 * Fetches data range coverage information from the backend
 * @returns An object containing the minimum and maximum dates covered in the dataset
 */
export async function fetchDateRange() {
    try {
        const resp = await apiClient.get(ENDPOINTS.dateRange())
        const data = resp.data
        console.debug('[fetchDateRange] response', data)
        return data
    } catch (err) {
        console.error('[fetchDateRange] error', err)
        throw err
    }
}