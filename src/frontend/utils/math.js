/**
 * Clamps a numeric value into the inclusive [min, max] range.
 * @param {number} value - Value to clamp.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns {number} Clamped value.
 */
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

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
