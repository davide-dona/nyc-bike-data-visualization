/**
 * Cursor-following tooltip explaining why the Add Surface button is disabled.
 * @param {string} text - Tooltip text; the caller gates rendering on it.
 * @param {{x: number, y: number}} position - Initial position inside the overlay.
 * @param {Object} tooltipRef - Ref to the tooltip node, used for RAF repositioning.
 * @returns The rendered tooltip.
 */
export default function AddLayerTooltip({ text, position, tooltipRef }) {
    return (
        <div
            ref={tooltipRef}
            className="surface-compare-add-tooltip"
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
            }}
            role="tooltip"
        >
            {text}
        </div>
    )
}
