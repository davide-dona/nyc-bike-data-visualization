import { WMO_WEATHER_CODES, getWeatherGroup } from "./wmo_code_handler.jsx"

/**
 * Formats the weather data for use in the scatter plot
 * @param {Array} data - The raw weather data
 * @returns {Array} The formatted data with additional metrics and weather group information for each data point
 */
export function formatData(data) {
    return data.map(d => {
        const code = d.weather_code
        const weatherGroup = getWeatherGroup(code)
        const weatherLabel = WMO_WEATHER_CODES[code]
        const hoursCount = Number(d.hours_count || 0)
        const hoursWithRides = Number(d.hours_with_rides || 0)
        const totalRides = Number(d.total_rides || 0)
        const ridesPerHour = hoursCount > 0 ? totalRides / hoursCount : 0
        const ridesPerDay = hoursCount > 0 ? totalRides / (hoursCount / 24) : 0
        // Standard error of the mean (std/√n); the speed std is sampled only over
        // hours with rides, so its n differs from hoursCount
        const ridesPerHourSE = d.rides_per_hour_std != null && hoursCount > 0
            ? Number(d.rides_per_hour_std) / Math.sqrt(hoursCount) : null
        const avgSpeedSE = d.average_speed_kmh_std != null && hoursWithRides > 0
            ? Number(d.average_speed_kmh_std) / Math.sqrt(hoursWithRides) : null
        return {
            totalRides,
            hoursCount,
            hoursWithRides,
            avgDistanceKm: Number(d.average_distance_km || 0),
            avgDurationMin: Number(d.average_duration_seconds || 0) / 60,
            avgSpeed: Number(d.average_speed_kmh || 0),
            ridesPerHour,
            ridesPerDay,
            ridesPerHourSE,
            avgSpeedSE,
            weatherGroup,
            weatherLabel,
        }
    })
}