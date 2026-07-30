import InsightFrame from '../../components/InsightFrame.jsx'
import InsightBarChart from '../../components/InsightBarChart.jsx'
import { formatCount, formatCompact } from '@/utils/numberFormat.js'
import useStationUsageInsights from '../hooks/useStationUsageInsights.js'
import { STATION_USAGE_TEXT } from '../utils/stationUsageText.js'

/**
 * Insight frames for the station usage layer: peak-hour distribution synced
 * to the time wheel, plus the busiest stations for the current filters.
 * @param {Object} insights - Station usage data slice (stations, query status).
 * @param {string} usageMode - Station usage mode ('all' | 'incoming' | 'outgoing').
 * @param {number} currentTime - Current time-wheel hour (fractional during animation).
 * @returns The rendered station usage insight frames.
 */
export default function StationUsageInsights({ insights, usageMode, currentTime }) {
    const { status, peakHours, busiestStations, wheelHour, peakHourNote, busiestNote } =
        useStationUsageInsights({ insights, usageMode, currentTime })

    return (
        <div className="map-insights__row">
            <InsightFrame
                title={STATION_USAGE_TEXT.peakHour.title}
                note={peakHourNote}
                status={status}
            >
                <InsightBarChart
                    labels={peakHours.labels}
                    values={peakHours.values}
                    highlightLabel={String(wheelHour)}
                    xAxisTitle={STATION_USAGE_TEXT.peakHour.xAxisTitle}
                    yAxisTitle={STATION_USAGE_TEXT.peakHour.yAxisTitle}
                    xLabelStep={3}
                    formatTooltipTitle={(label) => `Peak at ${String(label).padStart(2, '0')}:00`}
                    formatTooltipLabel={({ value }) => `${formatCount(value)} stations peak at this hour`}
                />
            </InsightFrame>
            <InsightFrame
                title={STATION_USAGE_TEXT.busiest.title}
                note={busiestNote}
                status={status}
            >
                <InsightBarChart
                    horizontal
                    labels={busiestStations.labels}
                    values={busiestStations.values}
                    xAxisTitle={STATION_USAGE_TEXT.busiest.xAxisTitle}
                    formatTooltipLabel={({ value }) => `${formatCompact(value)} avg rides per day`}
                />
            </InsightFrame>
        </div>
    )
}
