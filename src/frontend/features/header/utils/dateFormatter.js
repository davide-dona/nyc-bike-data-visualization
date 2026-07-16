/**
 * Parses an API date string into a local Date.
 * @param {string} dateValue - Date string in 'YYYY-MM-DD' form.
 * @returns {Date|null} The parsed date, or null for unrecognized input.
 */
function parseApiDate(dateValue) {
    if (typeof dateValue !== 'string') return null
    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    // If no match, the date format is unrecognized, so we return null to indicate an invalid date.
    if (!match) return null
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** Normalizes the date range by adjusting the minimum date to the first day of its month and the maximum date to the last day of its month, while also calculating the total number of months in the range.
 * @param {Object} dateRange - An object containing min_date and max_date properties
 * @returns An object with normalized minDate, maxDate, and totalMonths, or null if the input dates are invalid
 */
export function normalizeBounds(dateRange) {
    const minDate = parseApiDate(dateRange?.min_date)
    const maxDate = parseApiDate(dateRange?.max_date)
    
    if (!minDate || !maxDate) return null

    const normalizedMinDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    const normalizedMaxDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0)
    // Calculate total months in the range, inclusive of both min and max months
    const totalMonths = ( normalizedMaxDate.getFullYear() - normalizedMinDate.getFullYear() ) * 12 + (normalizedMaxDate.getMonth() - normalizedMinDate.getMonth()) + 1

    return {
        minDate: normalizedMinDate,
        maxDate: normalizedMaxDate,
        totalMonths,
    }
}

/**
 * Computes the start of the default last-N-months window: the first day of
 * the month `months - 1` months before maxDate's month, clamped to minDate
 * when the dataset covers fewer months.
 * @param {Date} minDate - Earliest available date.
 * @param {Date} maxDate - Latest available date.
 * @param {number} months - Window size in months.
 * @returns {Date} The window's start date.
 */
export function defaultWindowStart(minDate, maxDate, months) {
    const start = new Date(maxDate.getFullYear(), maxDate.getMonth() - (months - 1), 1)
    return start < minDate ? minDate : start
}