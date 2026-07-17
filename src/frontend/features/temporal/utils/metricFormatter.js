import { formatNumber } from '../../../utils/numberFormat.js'

export const METRIC_FORMATTERS = {
    total_rides: value => formatNumber(value, 2),
    average_duration_minutes: value => formatNumber(value, 2) + " min",
    average_distance: value => formatNumber(value, 2) + " km",
    average_speed_kmh: value => formatNumber(value, 2) + " km/h",
}

/**
 * Derives average rides per day from a stats row's totals and hour coverage.
 * @param {Object} row - Stats row with total_rides, hours_count, and optional hour.
 * @returns {number} Rides per covered day, 0 when coverage is missing.
 */
function getRidesPerDay(row) {
    const totalRides = Number(row?.total_rides ?? 0)
    const hoursCount = Number(row?.hours_count ?? 0)

    if (!Number.isFinite(totalRides) || !Number.isFinite(hoursCount) || hoursCount <= 0) {
        return 0
    }

    // Buckets without an hour dimension span all 24 hours of each day; hour buckets hold one slot per day.
    const daysCount = row?.hour == null
        ? hoursCount / 24
        : hoursCount

    return daysCount > 0 ? totalRides / daysCount : 0
}

// `noun` is the tooltip name for the value; the unit follows separately, so noun stays unit-free.
export const METRICS = {
    total_rides: {
        label: "Rides per Day",
        noun: "Rides",
        unit: "rides/day",
        get: getRidesPerDay,
        format: METRIC_FORMATTERS.total_rides,
    },
    average_duration_minutes: {
        label: "Avg Duration (min)",
        noun: "Duration",
        unit: "min",
        get: row => row.average_duration_seconds / 60,
        format: METRIC_FORMATTERS.average_duration_minutes,
    },
    average_speed_kmh: {
        label: "Avg Speed (km/h)",
        noun: "Speed",
        unit: "km/h",
        get: row => row.average_speed_kmh,
        format: METRIC_FORMATTERS.average_speed_kmh,
    },
    average_distance: {
        label: "Avg Distance (km)",
        noun: "Distance",
        unit: "km",
        get: row => row.average_distance_km,
        format: METRIC_FORMATTERS.average_distance,
    },
}

/**
 * Retrieves the metric configuration for a metric key.
 * @param {string} metric - Metric key.
 * @returns {Object} The metric config, falling back to total_rides.
 */
export const getMetricConfig = metric => METRICS[metric] ?? METRICS.total_rides
