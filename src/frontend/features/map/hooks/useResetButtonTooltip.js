import { useEffect, useRef, useState } from 'react'

/**
 * Handler hook for the reset button's disabled-state hover tooltip: tracks its
 * visibility and position, follows the cursor via a requestAnimationFrame, and
 * cancels the pending frame on leave/unmount.
 * @param {Object} params
 * @param {boolean} params.disabled - Whether the reset button is disabled (only then does the tooltip show).
 * @returns {Object} The tooltip node ref, its visibility flag and position, and the wrapper mouse handlers.
 */
export default function useResetButtonTooltip({ disabled }) {
    const tooltipRef = useRef(null)
    const tooltipAnimationFrameRef = useRef(null)
    const [showDisabledTooltip, setShowDisabledTooltip] = useState(false)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

    const positionDisabledTooltip = (clientX, clientY) => {
        const tooltipNode = tooltipRef.current
        if (!tooltipNode) return

        const nextX = clientX
        const nextY = clientY + 14

        if (tooltipAnimationFrameRef.current) {
            cancelAnimationFrame(tooltipAnimationFrameRef.current)
        }

        tooltipAnimationFrameRef.current = requestAnimationFrame(() => {
            tooltipNode.style.left = `${nextX}px`
            tooltipNode.style.top = `${nextY}px`
            tooltipAnimationFrameRef.current = null
        })
    }

    const handleMouseEnter = (event) => {
        if (!disabled) {
            setShowDisabledTooltip(false)
            return
        }

        setTooltipPosition({
            x: event.clientX,
            y: event.clientY + 14
        })
        setShowDisabledTooltip(true)
    }

    const handleMouseMove = (event) => {
        if (!disabled) {
            setShowDisabledTooltip(false)
            return
        }

        positionDisabledTooltip(event.clientX, event.clientY + 14)
    }

    const handleMouseLeave = () => {
        if (tooltipAnimationFrameRef.current) {
            cancelAnimationFrame(tooltipAnimationFrameRef.current)
            tooltipAnimationFrameRef.current = null
        }
        setShowDisabledTooltip(false)
    }

    useEffect(() => {
        return () => {
            if (tooltipAnimationFrameRef.current) {
                cancelAnimationFrame(tooltipAnimationFrameRef.current)
                tooltipAnimationFrameRef.current = null
            }
        }
    }, [])

    return {
        tooltipRef,
        showDisabledTooltip,
        tooltipPosition,
        handleMouseEnter,
        handleMouseMove,
        handleMouseLeave,
    }
}
