import { createPortal } from 'react-dom'

/** Shared floating tooltip, portaled to the document body; render-only, driven by useFloatingTooltip (or an equivalent hook). */
export default function FloatingTooltip({
    visible,
    position,
    nodeRef,
    role = 'tooltip',
    ariaLive,
    className = '',
    children,
}) {
    return createPortal(
        <div
            ref={nodeRef}
            role={role}
            aria-live={ariaLive}
            className={`floating-tooltip${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
        >
            {children}
        </div>,
        document.body,
    )
}
