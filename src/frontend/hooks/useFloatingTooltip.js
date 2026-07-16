import { useCallback, useEffect, useRef, useState } from 'react'
import { clampTooltipToViewport } from '@/utils/tooltipPosition.js'

/**
 * Shared handler hook for cursor-anchored floating tooltips: visibility state,
 * viewport-clamped positioning, and RAF-throttled tracking of the cursor.
 * Pairs with the render-only FloatingTooltip component.
 * @param {boolean} [isActive=true] - Whether the tooltip may show at all.
 * @param {number} [offsetX=0] - Horizontal offset from the anchor point.
 * @param {number} [offsetY=14] - Gap between the cursor and the tooltip edge.
 * @param {'center'|'left'} [align='center'] - Whether the tooltip centers on the cursor or hangs to its right.
 * @param {'below'|'above'} [vAlign='below'] - Whether the tooltip sits below or above the cursor.
 * @param {{width: number, height: number}} [fallbackSize] - Size estimate used before the node can be measured.
 * @returns {Object} isVisible, position, the tooltip node ref, updateTooltip (mouseenter/mousemove), and hideTooltip.
 */
export default function useFloatingTooltip({
    isActive = true,
    offsetX = 0,
    offsetY = 14,
    align = 'center',
    vAlign = 'below',
    fallbackSize = { width: 280, height: 70 },
} = {}) {
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const nodeRef = useRef(null)
    const isVisibleRef = useRef(false)
    const frameRef = useRef(null)

    const computePosition = useCallback(
        (clientX, clientY) => {
            const width = nodeRef.current?.offsetWidth ?? fallbackSize.width
            const height = nodeRef.current?.offsetHeight ?? fallbackSize.height
            const x = align === 'center' ? clientX - width / 2 + offsetX : clientX + offsetX
            const y = vAlign === 'above' ? clientY - height - offsetY : clientY + offsetY
            return clampTooltipToViewport({ x, y, width, height })
        },
        [align, vAlign, offsetX, offsetY, fallbackSize.width, fallbackSize.height],
    )

    const hideTooltip = useCallback(() => {
        if (frameRef.current) {
            cancelAnimationFrame(frameRef.current)
            frameRef.current = null
        }
        isVisibleRef.current = false
        setIsVisible(false)
    }, [])

    const updateTooltip = useCallback(
        (event) => {
            if (!isActive) {
                hideTooltip()
                return
            }

            const { clientX, clientY } = event
            // First show goes through state so the node renders at the right
            // spot; subsequent moves write styles directly to skip re-renders.
            if (!isVisibleRef.current || !nodeRef.current) {
                setPosition(computePosition(clientX, clientY))
                isVisibleRef.current = true
                setIsVisible(true)
                return
            }

            if (frameRef.current) cancelAnimationFrame(frameRef.current)
            frameRef.current = requestAnimationFrame(() => {
                const node = nodeRef.current
                if (node) {
                    const next = computePosition(clientX, clientY)
                    node.style.left = `${next.x}px`
                    node.style.top = `${next.y}px`
                }
                frameRef.current = null
            })
        },
        [isActive, computePosition, hideTooltip],
    )

    // Cancel any pending frame on unmount.
    useEffect(
        () => () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
        },
        [],
    )

    return { isVisible, position, nodeRef, updateTooltip, hideTooltip }
}
