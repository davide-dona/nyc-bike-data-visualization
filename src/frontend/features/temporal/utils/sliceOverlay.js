import { DAY_ORDER, HOUR_LABELS } from '@/utils/config.js'

/**
 * Derives the overlay series for a pinned day/hour slice.
 * Same grid semantics as buildSurfaceMatrix: missing day-hour cells are 0.
 * @param {Array} dayHourStats - GroupedStats rows with day_of_week (0=Monday) and hour.
 * @param {{type: 'day'|'hour', index: number}|null} pinnedSlice - The pinned bar.
 * @param {Function} metricGetter - Maps a stats row to the active metric value.
 * @returns {{target: 'hour'|'day', label: string, data: number[]}|null}
 *   Day pin -> that day's 24 hourly values overlaid on the hour histogram;
 *   hour pin -> that hour's 7 daily values overlaid on the day histogram.
 */
export function buildSliceOverlay(dayHourStats, pinnedSlice, metricGetter) {
    if (!pinnedSlice || !Array.isArray(dayHourStats)) return null

    const { type, index } = pinnedSlice
    if (type !== 'day' && type !== 'hour') return null

    const isDayPin = type === 'day'
    const data = Array(isDayPin ? 24 : 7).fill(0)

    for (const row of dayHourStats) {
        if (isDayPin ? row.day_of_week !== index : row.hour !== index) continue
        const value = Number(metricGetter(row))
        const slot = isDayPin ? row.hour : row.day_of_week
        if (slot >= 0 && slot < data.length) {
            data[slot] = Number.isFinite(value) ? value : 0
        }
    }

    return {
        target: isDayPin ? 'hour' : 'day',
        label: isDayPin ? DAY_ORDER[index] : `Hour ${String(HOUR_LABELS[index]).padStart(2, '0')}`,
        data,
    }
}
