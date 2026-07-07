
/**
 * Converts date filters to the year/month params the station APIs expect.
 * @param {Object} filters - Filters with optional start_date/end_date ISO strings.
 * @returns {Object} The filters with dates replaced by start/end year and month.
 */
export function toStationParams(filters = {}) {
    const { start_date, end_date, ...rest } = filters

    // If either date is missing or invalid, return the rest of the filters without date parameters
    if (!start_date || !end_date) {
        return rest
    }

    // Parse the dates and extract year and month for API parameters
    const start = new Date(`${start_date}T00:00:00Z`)
    const end = new Date(`${end_date}T00:00:00Z`)

    return {
        ...rest,
        start_year: start.getUTCFullYear(),
        start_month: start.getUTCMonth() + 1,
        end_year: end.getUTCFullYear(),
        end_month: end.getUTCMonth() + 1,
    }
}