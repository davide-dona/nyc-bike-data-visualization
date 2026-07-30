import { useCallback, useEffect, useRef, useState } from 'react'
import { clampTooltipToViewport } from '@/utils/tooltipPosition.js'

/** Handler hook for cursor-anchored floating tooltips: visibility state, viewport-clamped positioning, and RAF-throttled cursor tracking. Pairs with the render-only FloatingTooltip component. */
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
            // First show goes through state to render the node; later moves write styles directly to skip re-renders.
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

    useEffect(
        () => () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current)
        },
        [],
    )

    return { isVisible, position, nodeRef, updateTooltip, hideTooltip }
}
