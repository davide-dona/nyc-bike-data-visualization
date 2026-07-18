import { formatNumber } from '../../../utils/numberFormat.js'
import { RIDE_METRIC_LABELS } from '../../../utils/rideMetricLabels.js'

export const METRIC_FORMATTERS = {
    total_rides: value => formatNumber(value, 2),
    average_duration_minutes: value => formatNumber(value, 2) + " min",
    average_distance: value => formatNumber(value, 2) + " km",
    average_speed_kmh: value => formatNumber(value, 2) + " km/h",
}

/**
 * Derives the average rides value from a stats row's totals and hour coverage:
 * an average per hour for day-hour cells and hour marginals, an average per day
 * for day-of-week marginals, and (since a date row's hours_count is exactly one
 * day) that day's own total for date rows. The row's `hour` field distinguishes
 * hour-shaped rows from day-shaped ones, matching the backend's hours_count semantics.
 * @param {Object} row - Stats row with total_rides, hours_count, and optional hour.
 * @returns {number} The row's average (or, for a single date, its total) rides, 0 when coverage is missing.
 */
function getAverageRides(row) {
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

// Rides has three presentations, all sharing the same `get`/`format` but differing in label
const RIDES_BY_AGGREGATION = {
    hour: {
        label: RIDE_METRIC_LABELS.perHour.label,
        noun: "Rides",
        unit: RIDE_METRIC_LABELS.perHour.unit,
        get: getAverageRides,
        format: METRIC_FORMATTERS.total_rides,
    },
    day: {
        label: RIDE_METRIC_LABELS.perDay.label,
        noun: "Rides",
        unit: RIDE_METRIC_LABELS.perDay.unit,
        get: getAverageRides,
        format: METRIC_FORMATTERS.total_rides,
    },
    daily: {
        label: "Avg rides/day",
        noun: "Rides",
        unit: "rides/day",
        get: getAverageRides,
        format: METRIC_FORMATTERS.total_rides,
    },
}

export const METRICS = {
    average_rides: {
        label: "Avg rides",
        noun: "Avg rides",
        unit: "rides",
        get: getAverageRides,
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
 * Retrieves the metric configuration for a metric key. Only total_rides varies by
 * aggregation (its value is always an average or a single day's total depending on what
 * the rows represent); other metrics are per-ride averages regardless of grouping.
 * @param {string} metric - Metric key.
 * @param {'hour'|'day'|'daily'} [aggregation='hour'] - Time aggregation of the rows this config will read, for total_rides.
 * @returns {Object} The metric config, falling back to total_rides.
 */
export const getMetricConfig = (metric, aggregation = 'hour') => {
    if (metric == null || metric === 'total_rides') {
        return RIDES_BY_AGGREGATION[aggregation] ?? RIDES_BY_AGGREGATION.hour
    }
    return METRICS[metric] ?? RIDES_BY_AGGREGATION.hour
}
