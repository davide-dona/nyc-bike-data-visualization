import { formatNumber } from '@/utils/numberFormat.js'

/**
 * Formats a daily-rides value: whole numbers for large flows, one decimal
 * for the small per-day averages typical of focus mode.
 * @param {number} value - Daily rides.
 * @returns {string} Formatted value.
 */
export function formatDailyRides(value) {
    return formatNumber(value, value >= 10 ? 0 : 1)
}
