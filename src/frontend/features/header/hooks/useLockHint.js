import useFloatingTooltip from '@/hooks/useFloatingTooltip.js'

/**
 * Handler hook for the cursor-anchored "filters are locked" hint: a thin
 * wrapper over the shared floating-tooltip hook with the hint's anchoring.
 * @param {boolean} isActive - Whether the hint may show (filters currently locked).
 * @returns {Object} isLockHintVisible, lockHintPosition, the hint node ref, and the mouse handlers.
 */
export default function useLockHint({ isActive }) {
    const { isVisible, position, nodeRef, updateTooltip, hideTooltip } = useFloatingTooltip({
        isActive,
        offsetY: 14,
        align: 'center',
        fallbackSize: { width: 340, height: 70 },
    })

    return {
        isLockHintVisible: isVisible,
        lockHintPosition: position,
        lockHintRef: nodeRef,
        updateLockHintPosition: updateTooltip,
        hideLockHint: hideTooltip,
    }
}
