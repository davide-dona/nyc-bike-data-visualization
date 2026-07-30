import useFloatingTooltip from '@/hooks/useFloatingTooltip.js'
import FloatingTooltip from '@/components/FloatingTooltip.jsx'

/**
 * A single source citation: its label opens the source in a new tab, and
 * hovering shows the source's title, year, and a one-line summary.
 * @param {Object} cite - { label, url, title, year, summary }.
 */
export default function CitationLink({ cite }) {
    const { isVisible, position, nodeRef, updateTooltip, hideTooltip } = useFloatingTooltip({
        align: 'center',
        fallbackSize: { width: 260, height: 90 },
    })

    return (
        <>
            <a
                href={cite.url}
                target="_blank"
                rel="noopener noreferrer"
                className="citation-link"
                onMouseEnter={updateTooltip}
                onMouseMove={updateTooltip}
                onMouseLeave={hideTooltip}
            >
                {cite.label}
            </a>
            <FloatingTooltip visible={isVisible} position={position} nodeRef={nodeRef} className="citation-tooltip">
                <p className="citation-tooltip__title">{cite.title}</p>
                <p className="citation-tooltip__meta">{cite.year}</p>
                <p className="citation-tooltip__summary">{cite.summary}</p>
            </FloatingTooltip>
        </>
    )
}
