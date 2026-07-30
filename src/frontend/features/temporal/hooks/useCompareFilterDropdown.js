import { useEffect, useRef, useState } from 'react'

/**
 * Disclosure hook for the Compare filter dropdown: tracks open state, closes on
 * outside click, and wraps selection so choosing a value also closes the menu.
 * @param {Object} params
 * @param {Function} params.onChange - Invoked with the newly selected value.
 * @returns {{isOpen: boolean, rootRef: Object, toggle: Function, handleSelect: Function}} Open state, root ref, toggle, and select handler.
 */
export default function useCompareFilterDropdown({ onChange }) {
    const [isOpen, setIsOpen] = useState(false)
    const rootRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            const rootNode = rootRef.current
            if (!rootNode) return
            if (!rootNode.contains(event.target)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const toggle = () => setIsOpen((prev) => !prev)

    const handleSelect = (nextValue) => {
        onChange(nextValue)
        setIsOpen(false)
    }

    return { isOpen, rootRef, toggle, handleSelect }
}
