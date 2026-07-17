import { useEffect, useRef, useState } from 'react'

/**
 * Button that resets the map view to its default state.
 * @param {Function} onClick - Called on click to reset the map view.
 */
export default function ResetButton({ onClick, disabled = false }) {
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

    const handleDisabledMouseEnter = (event) => {
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

    const handleDisabledMouseMove = (event) => {
        if (!disabled) {
            setShowDisabledTooltip(false)
            return
        }

        positionDisabledTooltip(event.clientX, event.clientY + 14)
    }

    const handleDisabledMouseLeave = () => {
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

    return (
        <div
            className="map-reset-button-wrap"
            onMouseEnter={handleDisabledMouseEnter}
            onMouseMove={handleDisabledMouseMove}
            onMouseLeave={handleDisabledMouseLeave}
        >
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className="map-reset-button"
                aria-label="Reset map view"
                title={disabled ? undefined : 'Reset map view'}
            >
                <span className="map-reset-button-icon" aria-hidden="true">
                    <i className="fa-solid fa-rotate-left" />
                </span>
                <span className="map-reset-button-text">Reset View</span>
            </button>

            <div
                ref={tooltipRef}
                className={`map-reset-tooltip${showDisabledTooltip ? ' is-visible' : ''}`}
                style={{
                    left: `${tooltipPosition.x}px`,
                    top: `${tooltipPosition.y}px`,
                }}
                aria-hidden={!showDisabledTooltip}
            >
                Click a station to focus it first
            </div>
        </div>
    )
}   