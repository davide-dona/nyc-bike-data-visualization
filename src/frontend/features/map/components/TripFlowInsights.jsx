import { useMemo } from 'react'
import InsightFrame from './InsightFrame.jsx'
import InsightBarChart from './InsightBarChart.jsx'
import { topCorridors, topPartnersByFlow } from '../utils/insightSelectors.js'
import { BAR_SOLID, BAR_NEUTRAL } from '@/utils/styling'
import { LIMIT_TRIPS_OVERVIEW } from '@/utils/config.js'

/**
 * Insight frame for the trip flow layer: the strongest corridors citywide,
 * or the focused station's partners split by direction when a station is focused.
 * @param {Object} insights - Trip flow data slice (trips, focus state, query status).
 * @returns The rendered trip flow insight frame.
 */
export default function TripFlowInsights({ insights }) {
    const { trips, isFocusView, focusedStationName } = insights
    const status = insights

    const corridors = useMemo(() => topCorridors(trips, 10), [trips])
    const partners = useMemo(() => topPartnersByFlow(trips, 10), [trips])
    // Inbound bars grow left of the zero line, outbound bars grow right.
    const divergingGroups = useMemo(() => [
        { label: 'Inbound', values: partners.inbound.map((value) => -value), color: BAR_NEUTRAL },
        { label: 'Outbound', values: partners.outbound, color: BAR_SOLID },
    ], [partners])

    if (isFocusView) {
        return (
            <InsightFrame
                title={`Corridors of ${focusedStationName ?? 'the focused station'}`}
                note="Partners ranked by combined flow. Inbound rides grow left, outbound rides grow right, averaged per day. Click the station again or press Reset for the citywide view."
                status={status}
                emptyMessage={partners.labels.length === 0
                    ? 'No trips recorded for the focused station with the current filters.'
                    : null}
                tall
            >
                <InsightBarChart
                    horizontal
                    diverging
                    labels={partners.labels}
                    groups={divergingGroups}
                    xAxisTitle="Avg daily rides"
                />
            </InsightFrame>
        )
    }

    return (
        <InsightFrame
            title="Strongest corridors citywide"
            note={`Top ${LIMIT_TRIPS_OVERVIEW} corridors drawn on the map, top 10 charted. Click a station to focus its own corridors.`}
            status={status}
            emptyMessage={corridors.labels.length === 0
                ? 'No trips recorded for the current filters.'
                : null}
            tall
        >
            <InsightBarChart
                horizontal
                labels={corridors.labels}
                values={corridors.values}
                xAxisTitle="Avg daily rides"
            />
        </InsightFrame>
    )
}
