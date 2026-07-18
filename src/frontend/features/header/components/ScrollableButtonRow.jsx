import useScrollableButtonRow from '../hooks/useScrollableButtonRow.js'

/**
 * Horizontal scroller for filter button rows: shows edge arrows when the
 * content overflows and keeps them in sync on scroll and resize.
 * @param {import('react').ReactNode} children - The buttons to scroll.
 * @param {string} className - Extra classes for the wrapper.
 * @param {boolean} disabled - Disables the arrow buttons.
 * @returns The rendered scrollable row.
 */
export default function ScrollableButtonRow({ children, className = '', disabled = false }) {
    const {
        scrollerRef,
        canScrollLeft,
        canScrollRight,
        scrollByAmount,
        mergedClassName,
    } = useScrollableButtonRow({ children, className })

    return (
        <div className={`${mergedClassName}${disabled ? ' scrollable-button-row--disabled' : ''}`}>
            <button
                type="button"
                className={`scrollable-button-row__arrow scrollable-button-row__arrow--left${canScrollLeft ? ' is-visible' : ''}`}
                onClick={() => scrollByAmount(-1)}
                aria-label="Scroll left"
                disabled={disabled || !canScrollLeft}
                tabIndex={canScrollLeft ? 0 : -1}
            >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <div ref={scrollerRef} className="scrollable-button-row__scroller">
                {children}
            </div>
            <button
                type="button"
                className={`scrollable-button-row__arrow scrollable-button-row__arrow--right${canScrollRight ? ' is-visible' : ''}`}
                onClick={() => scrollByAmount(1)}
                aria-label="Scroll right"
                disabled={disabled || !canScrollRight}
                tabIndex={canScrollRight ? 0 : -1}
            >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
        </div>
    )
}
