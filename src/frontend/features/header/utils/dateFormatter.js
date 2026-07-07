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