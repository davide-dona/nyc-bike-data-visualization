import { useEffect, useState } from 'react'

/**
 * Manages the all/incoming/outgoing direction filter of the trip-flow layer.
 * Direction only has meaning relative to a focused station, so the filter
 * resets to 'all' whenever the focus changes (the toggle itself is disabled
 * in the citywide overview).
 * @param {string|null} focusedStationId - The focused station id; changes reset the filter.
 * @returns {{tripDirection: 'all'|'incoming'|'outgoing', setTripDirection: Function}}
 */
export function useTripFlowDirection({ focusedStationId }) {
    const [tripDirection, setTripDirection] = useState('all')

    useEffect(() => {
        setTripDirection('all')
    }, [focusedStationId])

    return { tripDirection, setTripDirection }
}
