import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Horizontal scroller for filter button rows: shows edge arrows when the
 * content overflows and keeps them in sync on scroll and resize.
 * @param {import('react').ReactNode} children - The buttons to scroll.
 * @param {string} className - Extra classes for the wrapper.
 * @param {boolean} disabled - Disables the arrow buttons.
 * @returns The rendered scrollable row.
 */
export default function ScrollableButtonRow({ children, className = '', disabled = false }) {
    const scrollerRef = useRef(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const updateScrollState = () => {
        const node = scrollerRef.current
        if (!node) return

        const { scrollLeft, scrollWidth, clientWidth } = node
        setCanScrollLeft(scrollLeft > 1)
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }

    useEffect(() => {
        updateScrollState()

        const node = scrollerRef.current
        if (!node) return undefined

        const handleScroll = () => updateScrollState()
        node.addEventListener('scroll', handleScroll, { passive: true })

        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => updateScrollState())
            : null

        if (resizeObserver) {
            resizeObserver.observe(node)
        }

        window.addEventListener('resize', updateScrollState)

        return () => {
            node.removeEventListener('scroll', handleScroll)
            window.removeEventListener('resize', updateScrollState)
            if (resizeObserver) resizeObserver.disconnect()
        }
    }, [children])

    const scrollByAmount = (direction) => {
        const node = scrollerRef.current
        if (!node) return

        const amount = Math.max(180, Math.floor(node.clientWidth * 0.8))
        node.scrollBy({ left: direction * amount, behavior: 'smooth' })
    }

    const mergedClassName = useMemo(() => {
        return ['scrollable-button-row', className].filter(Boolean).join(' ')
    }, [className])

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
