import { createPortal } from 'react-dom'

/**
 * Shared floating tooltip surface, portaled to the document body. Render-only:
 * visibility and position are driven by useFloatingTooltip (or an equivalent
 * handler hook), so every cursor-anchored tooltip shares one look and feel.
 * @param {boolean} visible - Whether the tooltip is shown (toggles opacity).
 * @param {{x: number, y: number}} position - Viewport position of the top-left corner.
 * @param {Object} nodeRef - Ref to the tooltip node, used for measurement and RAF repositioning.
 * @param {string} [role='tooltip'] - ARIA role of the tooltip node.
 * @param {string} [ariaLive] - Optional aria-live politeness for announced hints.
 * @param {string} [className] - Extra class for caller-specific content styling.
 * @param {import('react').ReactNode} children - Tooltip content.
 * @returns The portaled tooltip node.
 */
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
