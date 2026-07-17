import { useMemo } from 'react'
import InsightFrame from '../../components/InsightFrame.jsx'
import StatCard from '@/components/StatCard.jsx'
import TripFlowCorridorList from './TripFlowCorridorList.jsx'
import { rankCorridors, tripFlowFocusStats, tripFlowOverviewStats } from '../../utils/insightSelectors.js'
import { formatCount, formatNumber } from '@/utils/numberFormat.js'
import { TRIP_FLOW_LIST_SIZE } from '@/utils/config.js'
import { RIDE_METRIC_LABELS } from '@/utils/rideMetricLabels.js'

/**
 * Insight frame for the trip flow layer: headline stat tiles plus a ranked corridor list.
 * The overview summarizes the citywide corridor web; focusing a station switches to its
 * partners with an outbound/inbound split per row. Hovering/clicking a row links to the map arc.
 * @param {Object} insights - Trip flow data slice (trips, focus state, query status).
 * @param {Object} tripFlowHover - Corridor hover link ({ hoveredCorridorKey, onCorridorHover }).
 * @param {Object} tripFlowPin - Corridor pin link ({ pinnedCorridorKey, onCorridorToggle }).
 * @returns The rendered trip flow insight frame.
 */
export default function TripFlowInsights({ insights, tripFlowHover, tripFlowPin }) {
    const { trips, isFocusView, focusedStationName } = insights
    const status = insights
    const { hoveredCorridorKey, onCorridorHover } = tripFlowHover
    const { pinnedCorridorKey, onCorridorToggle } = tripFlowPin

    const rows = useMemo(() => rankCorridors(trips, TRIP_FLOW_LIST_SIZE), [trips])
    const stats = useMemo(
        () => (isFocusView ? tripFlowFocusStats(trips) : tripFlowOverviewStats(trips)),
        [trips, isFocusView],
    )
    const strongestCorridor = rows[0] ?? null

    if (isFocusView) {
        return (
            <InsightFrame
                title={`Corridors of ${focusedStationName ?? 'the focused station'}`}
                note="Bars show daily rides relative to the busiest corridor, split by direction, with actual average daily counts on the right. Hover or click to map its flow."                status={status}
                emptyMessage={rows.length === 0
                    ? 'No trips recorded for the focused station with the current filters.'
                    : null}
                autoHeight
            >
                <div className="map-insights__stat-row">
                    <StatCard value={formatCount(stats.totalDailyRides)} label={RIDE_METRIC_LABELS.perDay.label} />
                    <StatCard value={formatCount(stats.partnerCount)} label="Linked stations" />
                    <StatCard value={`${formatCount(stats.outboundShare * 100)}%`} label="Outbound Share" />
                    <StatCard value={`${formatNumber(stats.medianDistanceKm, 1)} km`} label="Median trip" />
                </div>
                <TripFlowCorridorList
                    rows={rows}
                    hoveredCorridorKey={hoveredCorridorKey}
                    onCorridorHover={onCorridorHover}
                    pinnedCorridorKey={pinnedCorridorKey}
                    onCorridorToggle={onCorridorToggle}
                    showSplit
                />
            </InsightFrame>
        )
    }

    return (
        <InsightFrame
            title="Strongest corridors citywide"    
            note="Bars show total volume relative to the busiest corridor, with actual average daily counts on the right. Hover or click to trace its flow."            status={status}
            emptyMessage={rows.length === 0
                ? 'No trips recorded for the current filters.'
                : null}
            autoHeight
        >
            <div className="map-insights__stat-row">
                <StatCard value={formatCount(stats.totalDailyRides)} label={RIDE_METRIC_LABELS.perDay.label} />
                <StatCard value={formatCount(stats.corridorCount)} label="Corridors" />
                <StatCard value={`${formatNumber(stats.medianDistanceKm, 1)} km`} label="Median corridor" />
                <StatCard
                    value={strongestCorridor ? formatCount(strongestCorridor.value) : '0'}
                    label="Strongest corridor"
                />
            </div>
            <TripFlowCorridorList
                rows={rows}
                hoveredCorridorKey={hoveredCorridorKey}
                onCorridorHover={onCorridorHover}
                pinnedCorridorKey={pinnedCorridorKey}
                onCorridorToggle={onCorridorToggle}
            />
        </InsightFrame>
    )
}
