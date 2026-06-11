
const HOURS_IN_DAY = 24

export const USAGE_MODES = ['all', 'incoming', 'outgoing']
const MODE_FIELDS = { all: 'total_rides', incoming: 'incoming_rides', outgoing: 'outgoing_rides' }

/**
 * Transforms raw station usage count data into a format suitable for map visualization.
 * Keeps one hourly usage array (index 0-23) per usage mode on each station so the
 * All / Incoming / Outgoing toggle switches series without refetching.
 * @param {Array} stationUsageCounts - An array of station usage count objects.
 * @returns {Array} An array of transformed station objects suitable for map visualization.
 */
export function selectStations(stationUsageCounts) {
    const stationRows = Array.isArray(stationUsageCounts) ? stationUsageCounts : []
    // For each station, create an hourly usage array per mode based on the grouped data.
    return stationRows
        .map((station) => {
            // Initialize an array per mode to hold average rides for each hour of the day.
            const hourlyByMode = Object.fromEntries(
                USAGE_MODES.map((mode) => [mode, Array.from({ length: HOURS_IN_DAY }, () => 0)])
            )
            if (Array.isArray(station.groups)) {
                station.groups.forEach((group) => {
                    const hour = Number(group.hour)
                    const hoursCount = Number(group.hours_count)

                    // Skip invalid buckets and avoid dividing by zero (0/0 => NaN).
                    if (!Number.isInteger(hour) || hour < 0 || hour >= HOURS_IN_DAY) return
                    if (!Number.isFinite(hoursCount) || hoursCount <= 0) return

                    const daysCount = hoursCount / HOURS_IN_DAY
                    USAGE_MODES.forEach((mode) => {
                        // Guard per mode: incoming can be 0 while outgoing is positive.
                        const rides = Number(group[MODE_FIELDS[mode]])
                        if (!Number.isFinite(rides) || rides <= 0) return
                        hourlyByMode[mode][hour] += rides / daysCount
                    })
                }
                )
            }
            return {
                stationId: station.station_id,
                lat: station.lat,
                lon: station.lon,
                hourlyByMode,       // Per mode, array of average rides for each hour
                meanByMode: Object.fromEntries(USAGE_MODES.map((mode) => [
                    mode,
                    hourlyByMode[mode].reduce((sum, usage) => sum + (Number.isFinite(usage) ? usage : 0), 0) / HOURS_IN_DAY,
                ])), // Per mode, average usage across all hours
            }
        })
}

/**
 * Returns station features for a specific hour frame.
 * @param {Array} stations - Station list from selectStations.
 * @param {number} hour - Hour frame index (0-23).
 * @param {string} mode - Usage mode ('all' | 'incoming' | 'outgoing').
 * @returns {Array} Station list with usage for the selected hour.
 */
export function getStationForCurrentTime(stations, hour, mode = 'all') {
    // For each station, extract the usage for the selected hour
    return stations.map((station) => ({
        stationId: station.stationId,
        lat: station.lat,
        lon: station.lon,
        usage: interpolateStationUsage(station, hour, mode), // Use interpolation for smoother animation
        meanUsage: station.meanByMode[mode], // Pass trough for per-station color scaling
    }))
}

/**
 * Helper function to interpolate station usage between two hours for smoother animation.
 * This allows the animation to show gradual changes in usage rather than abrupt jumps at each hour.
 * @param {Object} station Station object with hourlyByMode arrays.
 * @param {number} time Current time frame (can be a fractional hour for interpolation, e.g., 14.5 for halfway between 14:00 and 15:00).
 * @param {string} mode Usage mode ('all' | 'incoming' | 'outgoing').
 * @returns {number} the interpolated usage value for the station at the given time frame.
 */
function interpolateStationUsage(station, time, mode) {
    const hourlyUsage = station.hourlyByMode[mode]
    // Normalize hour to [0,23]
    const normalizedHour = ((time % HOURS_IN_DAY) + HOURS_IN_DAY) % HOURS_IN_DAY
    // Get the lower and upper hour indices for interpolation
    const lowerHour = Math.floor(normalizedHour)
    const higherHour = (lowerHour + 1) % HOURS_IN_DAY
    const t = normalizedHour - lowerHour // Fractional part for interpolation
    const lowerUsageValue = Number.isFinite(hourlyUsage[lowerHour]) ? hourlyUsage[lowerHour] : 0
    const higherUsageValue = Number.isFinite(hourlyUsage[higherHour]) ? hourlyUsage[higherHour] : 0

    // Linear interpolation between the two hours
    return lowerUsageValue + (higherUsageValue - lowerUsageValue) * t
}

/**
 * Get the maximum usage across all stations and hours for scaling the map visualization.
 * @param {Object} stations - Station list from selectStations.
 * @param {string} mode - Usage mode ('all' | 'incoming' | 'outgoing').
 * @returns {number} The maximum usage value.
 */
export function getMaxUsage(stations, mode = 'all') {
    return stations.reduce((globalMax, station) => {
        const hourlyUsage = station.hourlyByMode?.[mode]
        // Get the maximum usage for this station across all hours
        const stationMax = Array.isArray(hourlyUsage)
            ? Math.max(...hourlyUsage.map((usage) => Number(usage) || 0))
            : 0
        return Math.max(globalMax, stationMax)
    }, 0)
}

/**
 * Get the maximum absolute delta between hourly usage and mean usage across all stations and hours.
 * Used to set a symmetric color domain so neutral grey always represents the mean.
 * @param {Object} stations - Station list from selectStations.
 * @param {string} mode - Usage mode ('all' | 'incoming' | 'outgoing').
 * @returns {number} The maximum absolute delta value.
 */
export function getMaxDelta(stations, mode = 'all') {
    return stations.reduce((globalMax, station) => {
        const hourlyUsage = station.hourlyByMode?.[mode]
        if (!Array.isArray(hourlyUsage)) return globalMax
        const stationMax = hourlyUsage.reduce((max, usage) => {
            return Math.max(max, Math.abs(usage - station.meanByMode[mode]))
        }, 0)
        return Math.max(globalMax, stationMax)
    }, 0)
}
