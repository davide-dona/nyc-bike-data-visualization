import apiClient from '@/clients/apiClient.js'
import { ENDPOINTS } from '@/clients/apiConstants.js'
import { toStationParams } from '../utils/station_param.js'

async function fetchSingleStationStats(stationId, filters = {}) {
    const stationFilters = {
        ...toStationParams(filters),
        station_id: stationId,
    }

    const [usageResponse, flowResponse] = await Promise.all([
        apiClient.get(ENDPOINTS.stationUsageCounts(), {
            params: {
                ...stationFilters,
                group_by: 'day_of_week,hour',
            },
        }),
        apiClient.get(ENDPOINTS.stationFlowCounts(), {
            params: stationFilters,
        }),
    ])

    return {
        stationId,
        usage: usageResponse.data,
        flows: flowResponse.data,
    }
}

export async function fetchInfrastructureStationSidebarData(filters = {}) {
    const stationIds = Array.isArray(filters.stationIds) ? filters.stationIds.filter(Boolean) : []
    const selectionFilters = { ...filters }
    delete selectionFilters.stationIds

    if (!stationIds.length) {
        return { items: [], selectionFilters }
    }

    const items = await Promise.all(stationIds.map((stationId) => fetchSingleStationStats(stationId, selectionFilters)))

    return { items, selectionFilters }
}
