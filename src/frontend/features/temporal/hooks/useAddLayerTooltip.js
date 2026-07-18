import useFloatingTooltip from '@/hooks/useFloatingTooltip.js'
import { TEMPORAL_TEXT } from '../utils/temporalText.js'

/**
 * Handler hook for the cursor-following tooltip on the disabled Add Surface
 * button: a thin wrapper over the shared floating-tooltip hook that anchors
 * the hint centered above the cursor.
 * @param {boolean} isActive - Whether the tooltip should show (the draft selection is a duplicate).
 * @returns {Object} showTooltip, tooltipText, tooltipPosition, the tooltip node ref, and the mouse handlers.
 */
export default function useAddLayerTooltip({ isActive }) {
    const { isVisible, position, nodeRef, updateTooltip, hideTooltip } = useFloatingTooltip({
        isActive,
        align: 'center',
        vAlign: 'above',
        offsetY: 12,
        fallbackSize: { width: 260, height: 60 },
    })

    return {
        showTooltip: isVisible,
        tooltipText: isActive ? TEMPORAL_TEXT.compare.duplicateTooltip : null,
        tooltipPosition: position,
        addLayerTooltipRef: nodeRef,
        handleAddLayerMouseEnter: updateTooltip,
        handleAddLayerMouseMove: updateTooltip,
        handleAddLayerMouseLeave: hideTooltip,
    }
}
