import { useCallback, useState } from 'react'

/**
 * Manages the single focused station of the trip flow layer. The map opens on
 * the citywide overview (no focus); clicking a station focuses it, clicking
 * the focused station again returns to the overview.
 * @returns {{focusedStationId: string|null, onStationPick: Function, clearFocus: Function}}
 */
export function useTripStationFocus() {
    const [focusedStationId, setFocusedStationId] = useState(null)

    // Click handler for station picks: focuses the picked station, or clears
    // the focus when the picked station is already focused.
    const onStationPick = useCallback((info) => {
        const stationId = info?.object?.id
        if (!stationId) return
        setFocusedStationId((previousId) => (previousId === stationId ? null : stationId))
    }, [])

    const clearFocus = useCallback(() => setFocusedStationId(null), [])

    return { focusedStationId, onStationPick, clearFocus }
}
