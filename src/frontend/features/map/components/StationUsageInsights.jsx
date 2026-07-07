import { useMemo } from 'react'
import InsightFrame from './InsightFrame.jsx'
import InsightBarChart from './InsightBarChart.jsx'
import {
    aggregatePeakHourDistribution,
    topStationsByUsage,
} from '../utils/insightSelectors.js'
import { LIMIT_STATIONS } from '@/utils/config.js'

const HOURS_IN_DAY = 24

const USAGE_MODE_NOTES = {
    all: 'all rides',
    incoming: 'incoming rides only',
    outgoing: 'outgoing rides only',
}

/**
 * Insight frames for the station usage layer: peak-hour distribution synced
 * to the time wheel, plus the busiest stations for the current filters.
 * @param {Object} insights - Station usage data slice (stations, query status).
 * @param {string} usageMode - Station usage mode ('all' | 'incoming' | 'outgoing').
 * @param {number} currentTime - Current time-wheel hour (fractional during animation).
 * @returns The rendered station usage insight frames.
 */
export default function StationUsageInsights({ insights, usageMode, currentTime }) {
    const { stations } = insights
    const status = insights

    const peakHours = useMemo(
        () => aggregatePeakHourDistribution(stations, usageMode),
        [stations, usageMode],
    )
    const busiestStations = useMemo(
        () => topStationsByUsage(stations, usageMode, 10),
        [stations, usageMode],
    )

    const wheelHour = ((Math.floor(currentTime) % HOURS_IN_DAY) + HOURS_IN_DAY) % HOURS_IN_DAY
    const modeNote = USAGE_MODE_NOTES[usageMode] ?? USAGE_MODE_NOTES.all

    return (
        <div className="map-insights__row">
            <InsightFrame
                title="Stations by peak hour"
                note={`The amber bar follows the map's time wheel. Counting ${modeNote}.`}
                status={status}
            >
                <InsightBarChart
                    labels={peakHours.labels}
                    values={peakHours.values}
                    highlightLabel={String(wheelHour)}
                    xAxisTitle="Hour of Day"
                    yAxisTitle="Stations peaking"
                    xLabelStep={3}
                />
            </InsightFrame>
            <InsightFrame
                title="Busiest stations"
                note={`Top 10 of the ${LIMIT_STATIONS} busiest stations fetched for the current filters. Counting ${modeNote}.`}
                status={status}
            >
                <InsightBarChart
                    horizontal
                    labels={busiestStations.labels}
                    values={busiestStations.values}
                    xAxisTitle="Avg rides / day"
                />
            </InsightFrame>
        </div>
    )
}
