import { clamp } from './math.js'

/**
 * Clamps a floating tooltip's top-left corner so the tooltip stays fully
 * inside the viewport with a uniform margin. When the tooltip is larger than
 * the viewport, it pins to the margin edge.
 * @param {number} x - Proposed left position in viewport coordinates.
 * @param {number} y - Proposed top position in viewport coordinates.
 * @param {number} width - Tooltip width in pixels.
 * @param {number} height - Tooltip height in pixels.
 * @param {number} margin - Minimum distance from every viewport edge.
 * @returns {{x: number, y: number}} The clamped position.
 */
export function clampTooltipToViewport({ x, y, width, height, margin = 12 }) {
    const maxX = Math.max(margin, window.innerWidth - width - margin)
    const maxY = Math.max(margin, window.innerHeight - height - margin)
    return {
        x: clamp(x, margin, maxX),
        y: clamp(y, margin, maxY),
    }
}
