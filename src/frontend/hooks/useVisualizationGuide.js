import { useState } from 'react'

/**
 * Disclosure hook for the collapsible visualization guide: tracks collapsed
 * state and exposes a toggle for the show/hide button.
 * @returns {{collapsed: boolean, toggleCollapsed: Function}} Collapsed state and its toggle.
 */
export default function useVisualizationGuide() {
    const [collapsed, setCollapsed] = useState(false)

    const toggleCollapsed = () => setCollapsed((prev) => !prev)

    return { collapsed, toggleCollapsed }
}
