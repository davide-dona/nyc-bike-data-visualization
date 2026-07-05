/**
 * Client-side year filtering for bike-route segments. The API serializes
 * dates as ISO 'YYYY-MM-DD' strings, so plain string comparison is safe and
 * avoids Date parsing per segment. Keep every date comparison in this module
 * so a serializer change fails loudly in one place (and its unit tests).
 */

const currentYear = () => new Date().getFullYear()

/**
 * Returns the segments that were part of the network during the given year:
 * installed by the end of it and not retired before it started. Mirrors the
 * backend /bike_routes/history semantics, including treating segments without
 * an installation date as always installed.
 * @param {Array} routes - BikeRoute objects with instDate/retiredDate.
 * @param {number|null} year - Target year; null means the current year ("Present").
 * @returns {Array} The routes active in that year.
 */
export function filterRoutesByYear(routes, year) {
    const targetYear = year ?? currentYear()
    const yearEnd = `${targetYear}-12-31`
    const yearStart = `${targetYear}-01-01`

    return routes.filter((route) => {
        const installed = !route.instDate || route.instDate <= yearEnd
        const active = !route.retiredDate || route.retiredDate >= yearStart
        return installed && active
    })
}

/**
 * Derives the slider bounds from the data: earliest installation year found
 * (unparseable dates ignored) up to the current year.
 * @param {Array} routes - BikeRoute objects with instDate.
 * @returns {{minYear: number, maxYear: number}}
 */
export function getRouteYearBounds(routes) {
    const maxYear = currentYear()
    let minYear = maxYear

    for (const route of routes) {
        const year = Number(route.instDate?.slice(0, 4))
        if (Number.isFinite(year) && year > 0 && year < minYear) minYear = year
    }

    return { minYear, maxYear }
}
