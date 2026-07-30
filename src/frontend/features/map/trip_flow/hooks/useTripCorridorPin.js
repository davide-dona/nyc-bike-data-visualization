import { useCallback, useEffect, useState } from 'react'

/**
 * Manages the corridor pinned from the trip-flow leaderboard. Clicking a row
 * pins its corridor (the map keeps its camera; other arcs dim drastically),
 * clicking the same row again unpins it. Entering or leaving station focus
 * clears the pin, since the corridor set changes underneath it.
 * @param {string|null} focusedStationId - The focused station id; changes clear the pin.
 * @returns {{pinnedCorridorKey: string|null, toggleCorridorPin: Function, clearCorridorPin: Function}}
 */
export function useTripCorridorPin({ focusedStationId }) {
    const [pinnedCorridorKey, setPinnedCorridorKey] = useState(null)

    // Focus changes swap the corridor set, so any active pin becomes stale and is dropped.
    useEffect(() => {
        setPinnedCorridorKey(null)
    }, [focusedStationId])

    const toggleCorridorPin = useCallback((corridorKey) => {
        if (!corridorKey) return
        setPinnedCorridorKey((previousKey) => (previousKey === corridorKey ? null : corridorKey))
    }, [])

    const clearCorridorPin = useCallback(() => setPinnedCorridorKey(null), [])

    return { pinnedCorridorKey, toggleCorridorPin, clearCorridorPin }
}
