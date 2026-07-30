import { useMemo } from 'react'
import {
    rankCorridors,
    tripFlowFocusStats,
    tripFlowOverviewStats,
} from '../../utils/insightSelectors.js'
import { TRIP_FLOW_LIST_SIZE } from '@/utils/config.js'

/**
 * Handler hook for the trip-flow insight frame: ranks the corridors and computes
 * the headline stats for the current overview/focus view.
 * @param {Object} params
 * @param {Object} params.insights - Trip flow data slice (trips, focus state, query status).
 * @returns {Object} status, isFocusView, focusedStationName, rows, stats, strongestCorridor.
 */
export default function useTripFlowInsights({ insights }) {
    const { trips, isFocusView, focusedStationName } = insights

    const rows = useMemo(() => rankCorridors(trips, TRIP_FLOW_LIST_SIZE), [trips])
    const stats = useMemo(
        () => (isFocusView ? tripFlowFocusStats(trips) : tripFlowOverviewStats(trips)),
        [trips, isFocusView],
    )
    const strongestCorridor = rows[0] ?? null

    return { status: insights, isFocusView, focusedStationName, rows, stats, strongestCorridor }
}
