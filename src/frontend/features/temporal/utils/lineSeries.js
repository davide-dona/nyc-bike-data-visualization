/**
 * Sorts stats rows by their ISO date string, ascending.
 * @param {Array} rows - Per-date stats rows.
 * @returns {Array} A new sorted array.
 */
export function sortRowsByDate(rows = []) {
    return [...rows].sort((a, b) => String(a?.date ?? '').localeCompare(String(b?.date ?? '')))
}

/**
 * Builds the {date, value} line series for a metric, dropping rows without
 * a date or a finite value.
 * @param {Array} rows - Per-date stats rows.
 * @param {Function} metricGetter - Reads the active metric from a row.
 * @returns {Array<{date: string, value: number}>} The sorted series.
 */
export function buildSeries(rows = [], metricGetter) {
    const sortedRows = sortRowsByDate(rows)

    return sortedRows
        .map((row) => {
            const dateValue = row?.date ? String(row.date) : null
            const metricValue = Number(metricGetter(row))

            if (!dateValue || !Number.isFinite(metricValue)) {
                return null
            }

            return {
                date: dateValue,
                value: metricValue,
            }
        })
        .filter(Boolean)
}
