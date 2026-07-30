import { useMemo } from 'react'
import {
    aggregatePeakHourDistribution,
    topStationsByUsage,
} from '../../utils/insightSelectors.js'
import { STATION_USAGE_TEXT } from '../utils/stationUsageText.js'

const HOURS_IN_DAY = 24

/**
 * Handler hook for the station-usage insight frames: derives the peak-hour
 * distribution and busiest-station ranking for the current mode, plus the
 * time-wheel hour and the mode-specific note text.
 * @param {Object} params
 * @param {Object} params.insights - Station usage data slice (stations + query status).
 * @param {string} params.usageMode - Usage mode ('all' | 'incoming' | 'outgoing').
 * @param {number} params.currentTime - Current time-wheel hour (fractional during animation).
 * @returns {Object} status, peakHours, busiestStations, wheelHour, peakHourNote, busiestNote.
 */
export default function useStationUsageInsights({ insights, usageMode, currentTime }) {
    const { stations } = insights

    const peakHours = useMemo(
        () => aggregatePeakHourDistribution(stations, usageMode),
        [stations, usageMode],
    )
    const busiestStations = useMemo(
        () => topStationsByUsage(stations, usageMode, 10),
        [stations, usageMode],
    )

    const wheelHour = ((Math.floor(currentTime) % HOURS_IN_DAY) + HOURS_IN_DAY) % HOURS_IN_DAY
    const modeNote = STATION_USAGE_TEXT.modeNotes[usageMode] ?? STATION_USAGE_TEXT.modeNotes.all
    const peakHourNote = STATION_USAGE_TEXT.peakHour.noteLead + modeNote + STATION_USAGE_TEXT.peakHour.noteTail
    const busiestNote = STATION_USAGE_TEXT.busiest.noteLead + modeNote + STATION_USAGE_TEXT.busiest.noteTail

    return { status: insights, peakHours, busiestStations, wheelHour, peakHourNote, busiestNote }
}
