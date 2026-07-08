/**
 * Clamps a numeric value into the inclusive [min, max] range.
 * @param {number} value - Value to clamp.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns {number} Clamped value.
 */
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/**
 * Great-circle distance between two coordinates in kilometers.
 * @param {number} lat1 - Latitude of the first point, in degrees.
 * @param {number} lon1 - Longitude of the first point, in degrees.
 * @param {number} lat2 - Latitude of the second point, in degrees.
 * @param {number} lon2 - Longitude of the second point, in degrees.
 * @returns {number} Distance in kilometers.
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
    const EARTH_RADIUS_KM = 6371
    const toRad = (deg) => (deg * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

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
