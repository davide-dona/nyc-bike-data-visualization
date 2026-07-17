import { clamp } from './math.js'

/** Clamps a floating tooltip's top-left corner so it stays fully inside the viewport with a uniform margin (pins to the edge if the tooltip is larger than the viewport). */
export function clampTooltipToViewport({ x, y, width, height, margin = 12 }) {
    const maxX = Math.max(margin, window.innerWidth - width - margin)
    const maxY = Math.max(margin, window.innerHeight - height - margin)
    return {
        x: clamp(x, margin, maxX),
        y: clamp(y, margin, maxY),
    }
}
