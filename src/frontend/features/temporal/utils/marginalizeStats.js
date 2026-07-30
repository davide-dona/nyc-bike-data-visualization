/**
 * Client-side marginalization of day-by-hour ride stats: summing the grid's
 * additive totals per dimension and re-deriving averages reproduces the
 * backend's own day-of-week/hour groupings, so one day,hour fetch serves
 * the surface and both histograms.
 */

const SUMMED_FIELDS = [
    'total_rides',
    'hours_count',
    'hours_with_rides',
    'total_duration_seconds',
    'total_distance_km',
]

/**
 * Aggregates day-by-hour stat rows into the marginal of one dimension, with
 * the other dimension set to null (metric getters branch on `row.hour ==
 * null` to interpret hours_count). Std fields aren't reconstructable from
 * group stds, so they're set to null; no marginal consumer reads them.
 * @param {Array} dayHourRows - GroupedStats rows from group_by=day_of_week,hour.
 * @param {'day_of_week'|'hour'} dim - Dimension to keep.
 * @returns {Array} GroupedStats-shaped rows, one per dimension value.
 */
export function marginalizeDayHour(dayHourRows, dim) {
    const buckets = new Map()

    for (const row of dayHourRows ?? []) {
        const key = row?.[dim]
        if (key == null) continue
        let bucket = buckets.get(key)
        if (!bucket) {
            bucket = Object.fromEntries(SUMMED_FIELDS.map((field) => [field, 0]))
            buckets.set(key, bucket)
        }
        for (const field of SUMMED_FIELDS) {
            bucket[field] += Number(row[field]) || 0
        }
    }

    return [...buckets.entries()]
        .sort(([a], [b]) => a - b)
        .map(([key, totals]) => ({
            day_of_week: dim === 'day_of_week' ? key : null,
            hour: dim === 'hour' ? key : null,
            ...totals,
            average_duration_seconds: totals.total_rides > 0
                ? totals.total_duration_seconds / totals.total_rides : 0,
            average_distance_km: totals.total_rides > 0
                ? totals.total_distance_km / totals.total_rides : 0,
            average_speed_kmh: totals.total_duration_seconds > 0
                ? totals.total_distance_km / (totals.total_duration_seconds / 3600) : 0,
            rides_per_hour_std: null,
            average_speed_kmh_std: null,
        }))
}
