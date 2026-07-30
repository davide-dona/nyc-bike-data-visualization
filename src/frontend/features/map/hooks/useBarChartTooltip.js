import { useCallback, useState } from 'react'
import useFloatingTooltip from '@/hooks/useFloatingTooltip.js'

/**
 * Handler hook for hovering one of several bars in a CSS-only bar chart:
 * pairs the shared floating-tooltip positioning with the hovered bar's
 * content, so a single tooltip instance can serve every bar in the chart.
 * @returns {Object} isVisible, position, the tooltip node ref, showTooltip(content, event), hideTooltip, and the hovered content.
 */
export default function useBarChartTooltip() {
    const [content, setContent] = useState(null)
    const { isVisible, position, nodeRef, updateTooltip, hideTooltip } = useFloatingTooltip({
        offsetY: 14,
        align: 'center',
        fallbackSize: { width: 220, height: 50 },
    })

    const showTooltip = useCallback((nextContent, event) => {
        setContent(nextContent)
        updateTooltip(event)
    }, [updateTooltip])

    return { isVisible, position, nodeRef, content, showTooltip, hideTooltip }
}
