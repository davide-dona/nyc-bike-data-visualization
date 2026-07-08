import { useMemo } from 'react'
import InsightFrame from './InsightFrame.jsx'
import InsightStatTile from './InsightStatTile.jsx'
import TripFlowCorridorList from './TripFlowCorridorList.jsx'
import { rankCorridors, tripFlowFocusStats, tripFlowOverviewStats } from '../utils/insightSelectors.js'
import { formatCount, formatNumber } from '@/utils/numberFormat.js'
import { LIMIT_TRIPS_OVERVIEW, TRIP_FLOW_LIST_SIZE } from '@/utils/config.js'

/**
 * Insight frame for the trip flow layer: headline stat tiles plus a ranked
 * corridor list. The overview summarizes the citywide corridor web; focusing
 * a station switches to its partners with an outbound/inbound split per row.
 * Hovering a row traces the matching arc on the map and vice versa.
 * @param {Object} insights - Trip flow data slice (trips, focus state, query status).
 * @param {Object} tripFlowHover - Corridor hover link ({ hoveredCorridorKey, onCorridorHover }).
 * @returns The rendered trip flow insight frame.
 */
export default function TripFlowInsights({ insights, tripFlowHover }) {
    const { trips, isFocusView, focusedStationName } = insights
    const status = insights
    const { hoveredCorridorKey, onCorridorHover } = tripFlowHover

    const rows = useMemo(() => rankCorridors(trips, TRIP_FLOW_LIST_SIZE), [trips])
    const stats = useMemo(
        () => (isFocusView ? tripFlowFocusStats(trips) : tripFlowOverviewStats(trips)),
        [trips, isFocusView],
    )

    if (isFocusView) {
        return (
            <InsightFrame
                title={`Corridors of ${focusedStationName ?? 'the focused station'}`}
                note="Every corridor of the focused station is drawn on the map; the strongest are listed here. Hover a row to trace its corridor. Click the station again, click empty map, or press Reset View for the citywide picture."
                status={status}
                emptyMessage={rows.length === 0
                    ? 'No trips recorded for the focused station with the current filters.'
                    : null}
                autoHeight
            >
                <div className="map-insights__stat-row">
                    <InsightStatTile value={formatCount(stats.totalDailyRides)} label="Daily rides" hint="avg per day" />
                    <InsightStatTile value={formatCount(stats.partnerCount)} label="Partners" hint="stations linked" />
                    <InsightStatTile value={`${formatCount(stats.outboundShare * 100)}%`} label="Outbound" hint="of rides leave here" />
                    <InsightStatTile value={`${formatNumber(stats.medianDistanceKm, 1)} km`} label="Median trip" hint="flow-weighted" />
                </div>
                <TripFlowCorridorList
                    rows={rows}
                    hoveredCorridorKey={hoveredCorridorKey}
                    onCorridorHover={onCorridorHover}
                    showSplit
                />
            </InsightFrame>
        )
    }

    return (
        <InsightFrame
            title="Strongest corridors citywide"
            note={`Top ${LIMIT_TRIPS_OVERVIEW} corridors drawn on the map, strongest ${TRIP_FLOW_LIST_SIZE} listed and emphasized on the map. Hover a row to trace its corridor. Click a station to see all of its corridors.`}
            status={status}
            emptyMessage={rows.length === 0
                ? 'No trips recorded for the current filters.'
                : null}
            autoHeight
        >
            <div className="map-insights__stat-row">
                <InsightStatTile value={formatCount(stats.totalDailyRides)} label="Daily rides" hint={`top ${LIMIT_TRIPS_OVERVIEW} corridors`} />
                <InsightStatTile value={formatCount(stats.corridorCount)} label="Corridors" hint="drawn on the map" />
                <InsightStatTile value={`${formatNumber(stats.medianDistanceKm, 1)} km`} label="Median corridor" hint="flow-weighted" />
            </div>
            <TripFlowCorridorList
                rows={rows}
                hoveredCorridorKey={hoveredCorridorKey}
                onCorridorHover={onCorridorHover}
            />
        </InsightFrame>
    )
}
