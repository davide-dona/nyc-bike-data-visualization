/**
 * Builds the 7x24 value grid backing the surface plot.
 * @param {Array} data - Day-hour stats rows.
 * @param {Function} metricGetter - Reads the active metric from a row.
 * @returns {number[][]} A [day][hour] matrix, 0 where data is missing.
 */
export function buildSurfaceMatrix(data, metricGetter) {
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0))

    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        // Backend day_of_week is already 0=Monday .. 6=Sunday, matching DAY_LABELS
        const day = row.day_of_week
        const value = Number(metricGetter(row))
        grid[day][row.hour] = Number.isFinite(value) ? value : 0
    }

    return grid
}
