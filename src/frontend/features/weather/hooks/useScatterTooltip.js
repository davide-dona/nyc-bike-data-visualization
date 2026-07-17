import { useCallback, useRef, useState } from 'react'
import { clampTooltipToViewport } from '@/utils/tooltipPosition.js'

const TOOLTIP_OFFSET_X = 34
const TOOLTIP_OFFSET_Y = -26
const VIEWPORT_MARGIN = 12
const FALLBACK_SIZE = { width: 280, height: 240 }

/**
 * Bridges the Chart.js external tooltip into the shared FloatingTooltip, anchoring beside the hovered point and flipping left when it would overflow the viewport.
 * @returns {Object} tooltip state, node ref, and the external tooltip handler.
 */
export default function useScatterTooltip() {
    const [tooltip, setTooltip] = useState({ visible: false, point: null, position: { x: 0, y: 0 } })
    const nodeRef = useRef(null)

    const handleExternalTooltip = useCallback(({ chart, tooltip: model }) => {
        if (model.opacity === 0) {
            setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev))
            return
        }

        const point = model.dataPoints?.[0]?.raw
        if (!point) return

        const canvasRect = chart.canvas.getBoundingClientRect()
        const pointX = canvasRect.left + model.caretX
        const pointY = canvasRect.top + model.caretY
        const width = nodeRef.current?.offsetWidth ?? FALLBACK_SIZE.width
        const height = nodeRef.current?.offsetHeight ?? FALLBACK_SIZE.height

        // Prefer the right side of the point; flip left when it would overflow.
        const canPlaceRight =
            pointX + TOOLTIP_OFFSET_X + width <= window.innerWidth - VIEWPORT_MARGIN
        const baseLeft = canPlaceRight
            ? pointX + TOOLTIP_OFFSET_X
            : pointX - TOOLTIP_OFFSET_X - width

        const position = clampTooltipToViewport({
            x: baseLeft,
            y: pointY + TOOLTIP_OFFSET_Y,
            width,
            height,
            margin: VIEWPORT_MARGIN,
        })

        setTooltip({ visible: true, point, position })
    }, [])

    return { tooltip, tooltipNodeRef: nodeRef, handleExternalTooltip }
}
