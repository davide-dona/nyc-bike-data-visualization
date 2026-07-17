import { WMO_WEATHER_CODES, getWeatherGroup } from "./wmoCodeHandler.js"

/**
 * Formats raw weather data for the scatter plot, adding derived metrics (rides/hour, SE) and weather group/label.
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
        // SEM (std/√n); speed std samples only hours-with-rides, so n differs from hoursCount
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
            ridesPerHourSE,
            avgSpeedSE,
            weatherGroup,
            weatherLabel,
        }
    })
}