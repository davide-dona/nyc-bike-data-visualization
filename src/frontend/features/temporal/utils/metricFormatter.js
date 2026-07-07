import { formatNumber } from '../../../utils/numberFormat.js'

// Utility functions and configurations for formatting and retrieving metrics
export const METRIC_FORMATTERS = {
    total_rides: value => formatNumber(value, 2),
    average_duration_minutes: value => formatNumber(value, 2) + " min",
    average_distance: value => formatNumber(value, 2) + " km",
    average_speed_kmh: value => formatNumber(value, 2) + " km/h",
}

function getRidesPerDay(row) {
    const totalRides = Number(row?.total_rides ?? 0)
    const hoursCount = Number(row?.hours_count ?? 0)

    if (!Number.isFinite(totalRides) || !Number.isFinite(hoursCount) || hoursCount <= 0) {
        return 0
    }

    // Buckets without an hour dimension (date, day_of_week, ungrouped) span
    // all 24 hours of each day they cover; hour buckets hold one slot per day.
    const daysCount = row?.hour == null
        ? hoursCount / 24
        : hoursCount

    return daysCount > 0 ? totalRides / daysCount : 0
}
// Configuration object that defines the available metrics.
// `noun` is the short tooltip name for the value; the unit follows it there,
// so it stays unit-free.
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

// Retrieves the metric configuration for a given metric key
export const getMetricConfig = metric => METRICS[metric] ?? METRICS.total_rides
export const getMetricValue = (metric, row) => getMetricConfig(metric).get(row)

// Precompute mappings for metric getters, labels, formats, and units
export const METRIC_GETTERS = Object.fromEntries(
    Object.entries(METRICS).map(([key, config]) => [key, config.get])
)
// These mappings allow for easy access to metric labels
export const METRIC_LABELS = Object.fromEntries(
    Object.entries(METRICS).map(([key, config]) => [key, config.label])
)
// These mappings allow for easy access to metric formats
export const METRIC_FORMATS = Object.fromEntries(
    Object.entries(METRICS).map(([key, config]) => [key, config.format])
)
// These mappings allow for easy access to metric units
export const METRIC_UNITS = Object.fromEntries(
    Object.entries(METRICS).map(([key, config]) => [key, config.unit])
)
// Utility function to format a metric value based on the metric's formatting function, providing a consistent way to display metric values across the application.
export const formatMetricValue = (metric, value) => {
    const formatter = METRIC_FORMATTERS[metric]
    return formatter ? formatter(value) : String(value)
}
