import useResetButtonTooltip from '../hooks/useResetButtonTooltip.js'
import { MAP_TEXT } from '../utils/mapText.js'

/**
 * Button that resets the map view to its default state.
 * @param {Function} onClick - Called on click to reset the map view.
 * @param {boolean} [disabled=false] - Whether the button is disabled (shows the hover hint instead).
 * @returns The rendered reset button with its disabled-state tooltip.
 */
export default function ResetButton({ onClick, disabled = false }) {
    const {
        tooltipRef,
        showDisabledTooltip,
        tooltipPosition,
        handleMouseEnter,
        handleMouseMove,
        handleMouseLeave,
    } = useResetButtonTooltip({ disabled })

    return (
        <div
            className="map-reset-button-wrap"
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className="map-reset-button"
                aria-label="Reset map view"
                title={disabled ? undefined : MAP_TEXT.reset.title}
            >
                <span className="map-reset-button-icon" aria-hidden="true">
                    <i className="fa-solid fa-rotate-left" />
                </span>
                <span className="map-reset-button-text">{MAP_TEXT.reset.label}</span>
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
                {MAP_TEXT.reset.disabledTooltip}
            </div>
        </div>
    )
}
