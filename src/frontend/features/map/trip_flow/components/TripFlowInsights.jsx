import InsightFrame from '../../components/InsightFrame.jsx'
import StatCard from '@/components/StatCard.jsx'
import TripFlowCorridorList from './TripFlowCorridorList.jsx'
import { formatCount, formatNumber } from '@/utils/numberFormat.js'
import { RIDE_METRIC_LABELS } from '@/utils/rideMetricLabels.js'
import useTripFlowInsights from '../hooks/useTripFlowInsights.js'
import { TRIP_FLOW_TEXT } from '../utils/tripFlowText.js'

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
    const { status, isFocusView, focusedStationName, rows, stats, strongestCorridor } =
        useTripFlowInsights({ insights })
    const { hoveredCorridorKey, onCorridorHover } = tripFlowHover
    const { pinnedCorridorKey, onCorridorToggle } = tripFlowPin

    if (isFocusView) {
        return (
            <InsightFrame
                title={TRIP_FLOW_TEXT.focus.titleLead + (focusedStationName ?? TRIP_FLOW_TEXT.focus.titleFallback)}
                note={TRIP_FLOW_TEXT.focus.note}
                status={status}
                emptyMessage={rows.length === 0 ? TRIP_FLOW_TEXT.focus.emptyMessage : null}
                autoHeight
            >
                <div className="map-insights__stat-row">
                    <StatCard value={formatCount(stats.totalDailyRides)} label={RIDE_METRIC_LABELS.perDay.label} />
                    <StatCard value={formatCount(stats.partnerCount)} label={TRIP_FLOW_TEXT.focus.partnerCountLabel} />
                    <StatCard value={`${formatCount(stats.outboundShare * 100)}%`} label={TRIP_FLOW_TEXT.focus.outboundShareLabel} />
                    <StatCard value={`${formatNumber(stats.medianDistanceKm, 1)} km`} label={TRIP_FLOW_TEXT.focus.medianDistanceLabel} />
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
            title={TRIP_FLOW_TEXT.overview.title}
            note={TRIP_FLOW_TEXT.overview.note}
            status={status}
            emptyMessage={rows.length === 0 ? TRIP_FLOW_TEXT.overview.emptyMessage : null}
            autoHeight
        >
            <div className="map-insights__stat-row">
                <StatCard value={formatCount(stats.totalDailyRides)} label={RIDE_METRIC_LABELS.perDay.label} />
                <StatCard value={formatCount(stats.corridorCount)} label={TRIP_FLOW_TEXT.overview.corridorCountLabel} />
                <StatCard value={`${formatNumber(stats.medianDistanceKm, 1)} km`} label={TRIP_FLOW_TEXT.overview.medianDistanceLabel} />
                <StatCard
                    value={strongestCorridor ? formatCount(strongestCorridor.value) : '0'}
                    label={TRIP_FLOW_TEXT.overview.strongestCorridorLabel}
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
