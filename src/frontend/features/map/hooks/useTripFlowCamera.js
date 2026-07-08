import { useEffect, useRef } from 'react'
import { computeFocusBounds, fitViewForBounds } from '../utils/tripFlowBounds.js'
import { INITIAL_VIEW_STATE } from '../utils/mapConfig.js'

// Fallback viewport size when the map shell has not been measured yet.
const FALLBACK_VIEWPORT = { width: 1200, height: 800 }

/**
 * Handler hook driving the trip-flow camera: when a station gains focus the
 * map flies to frame that station's strongest corridors, and when focus
 * clears it flies back to the initial citywide view. Each focused station
 * triggers exactly one flight, and stale cached rows (from a previously
 * focused station) never move the camera.
 * @param {Object} params - Hook parameters.
 * @param {string} params.activeLayer - The active map layer key.
 * @param {string|null} params.focusedStationId - Focused station id, null in overview.
 * @param {Array} params.trips - Trip rows (oriented to the focused station in focus view).
 * @param {boolean} params.tripLoading - Whether the trip flow query is in flight.
 * @param {Function} params.flyTo - Animated camera setter from useMapHandler.
 * @param {Object} params.mapShellRef - Ref to the map shell element, for viewport size.
 */
export function useTripFlowCamera({
    activeLayer,
    focusedStationId,
    trips,
    tripLoading,
    flyTo,
    mapShellRef,
}) {
    const lastFlownStationIdRef = useRef(null)

    useEffect(() => {
        if (activeLayer !== 'trip_flow') return

        // Focus cleared: return to the citywide view once, if a flight happened.
        if (!focusedStationId) {
            if (lastFlownStationIdRef.current !== null) {
                lastFlownStationIdRef.current = null
                flyTo(INITIAL_VIEW_STATE)
            }
            return
        }

        if (tripLoading || trips.length === 0) return
        // Oriented rows always start at the focused station; anything else is
        // a stale cache from the previous focus.
        if (trips[0].start_station_id !== focusedStationId) return
        if (lastFlownStationIdRef.current === focusedStationId) return

        const bounds = computeFocusBounds(trips)
        if (!bounds) return
        const shell = mapShellRef?.current
        const viewport = shell
            ? { width: shell.clientWidth, height: shell.clientHeight }
            : FALLBACK_VIEWPORT
        lastFlownStationIdRef.current = focusedStationId
        flyTo(fitViewForBounds(bounds, viewport))
    }, [activeLayer, focusedStationId, trips, tripLoading, flyTo, mapShellRef])
}
