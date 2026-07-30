import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Handler hook for the scrollable button row: measures overflow to toggle the
 * edge arrows, keeps them synced on scroll and resize, and exposes the scroll action.
 * @param {Object} params
 * @param {import('react').ReactNode} params.children - Row content whose size drives the affordance measurement.
 * @param {string} params.className - Extra classes merged into the wrapper.
 * @returns {Object} The scroller ref, edge-arrow visibility flags, merged class name, and the scroll-by action.
 */
export default function useScrollableButtonRow({ children, className = '' }) {
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

    return { scrollerRef, canScrollLeft, canScrollRight, scrollByAmount, mergedClassName }
}
