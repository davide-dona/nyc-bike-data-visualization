/**
 * Canonical wording for the app's three ride-count concepts. The same underlying
 * quantity is computed in several places (map layers, weather charts, temporal
 * charts, trip flow) and must read identically everywhere it appears, so every
 * view imports these instead of writing its own label/unit strings.
 */
export const RIDE_METRIC_LABELS = {
    // A raw sum over the whole query window - no averaging.
    total: { label: 'Total rides', unit: 'rides' },
    // total_rides / number of days covered.
    perDay: { label: 'Avg rides / day', unit: 'rides/day' },
    // total_rides / number of matching hour-slots covered.
    perHour: { label: 'Avg rides / hour', unit: 'rides/h' },
}
