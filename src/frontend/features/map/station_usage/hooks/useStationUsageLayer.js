import { useMemo } from 'react'
import useStationUsageCounts from './useStationUsageCounts.js'
import {
    selectStations,
    getStationForCurrentTime,
    getMaxUsage,
    getMaxDelta,
} from '../utils/stationUsageSelector.js'
import { LIMIT_STATIONS } from '@/utils/config.js'

/**
 * Fetches and processes station usage data for the station usage layer.
 * Elevation is normalized against the 'all' maximum for every mode so hexagon
 * heights stay linear in ride count; color keeps a per-mode delta domain
 * (deviation from the station's own mean).
 * @param {Object} filters - Optional filters (date range, user-selected filters, etc).
 * @param {number} currentTime - Current hour frame (0-23).
 * @param {string} usageMode - Metric encoded by the layer ('all' | 'incoming' | 'outgoing').
 * @returns {Object} Filtered station data, max usage/delta, loading state, and error state.
 */
export function useStationUsageLayer({ filters, currentTime, usageMode = 'all' }) {
    const stationUsageCountFilters = {
        limit: LIMIT_STATIONS,
        group_by: 'hour',
        ...(filters ?? {})
    }

    const { stationUsageCounts,
        loading: loading,
        error: error,
        refetch,
    } = useStationUsageCounts(stationUsageCountFilters)

    const stations = useMemo(() => selectStations(stationUsageCounts), [stationUsageCounts])
    const frameStations = useMemo(() => getStationForCurrentTime(stations, currentTime, usageMode), [stations, currentTime, usageMode])
    // Shared elevation domain: always the 'all' max, so mode heights are comparable
    const maxUsage = useMemo(() => getMaxUsage(stations, 'all'), [stations])
    const maxDelta = useMemo(() => getMaxDelta(stations, usageMode), [stations, usageMode])

    // Both stations (full series) and frameStations (current hour) are exposed so insights can aggregate without refetching.
    return { stations, frameStations, maxUsage, maxDelta, loading, error, refetch }
}