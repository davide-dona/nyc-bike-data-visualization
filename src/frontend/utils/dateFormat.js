/**
 * Formats a Date as a local 'YYYY-MM-DD' string (no timezone conversion).
 * @param {Date} date - The date to format.
 * @returns {string} The zero-padded ISO-style date string.
 */
export function formatIsoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Returns the last day of a month.
 * @param {number} year - Full year.
 * @param {number} monthIndex - Zero-based month index.
 * @returns {number} The day number of the month's last day (28-31).
 */
export function lastDayOfMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate()
}
