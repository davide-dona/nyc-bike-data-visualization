// Weekday labels indexed Monday-first, matching the backend's day_of_week
export const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_FULL = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays']

/**
 * Rounds up to 1/2/5 x 10^k so axis ticks land on clean values.
 * @param {number} value - The raw axis maximum.
 * @returns {number} The nearest nice ceiling, at least 1.
 */
export function niceCeil(value) {
    if (!Number.isFinite(value) || value <= 0) return 1
    const base = Math.pow(10, Math.floor(Math.log10(value)))
    const norm = value / base
    const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
    return nice * base
}

/**
 * Renders the sidebar's flow-balance highlight as human-readable text.
 * @param {{pctDiff: number}} netFlow - Relative departures/arrivals difference.
 * @returns {string} Balanced, or the surplus direction with its percentage.
 */
export function flowBalanceText({ pctDiff }) {
    const pct = Math.round(Math.abs(pctDiff) * 100)
    if (pct < 1) return 'Balanced in/out'
    return pctDiff > 0 ? `+${pct}% more departures` : `+${pct}% more arrivals`
}

/**
 * Explains a station character label with its commute signature.
 * @param {string} label - Character label from the sidebar summary.
 * @returns {string|null} A short hint, or null for neutral profiles.
 */
export function characterHint(label) {
    if (label === 'Workplace-like') return 'AM arrivals · PM departures'
    if (label === 'Residential-like') return 'AM departures · PM arrivals'
    return null
}

/**
 * Returns today's Monday-first weekday index, matching DAY_ORDER/DAY_FULL.
 * @returns {number} 0 (Monday) through 6 (Sunday).
 */
export function todayWeekdayIndex() {
    return (new Date().getDay() + 6) % 7
}
