import { useCallback } from 'react'

/**
 * Handler hook for layer-aware map clicks: clicking empty map first clears an
 * active corridor pin, then exits the trip-flow focus, or clears the
 * infrastructure station selection; station and arc picks pass through
 * untouched.
 * @param {string} activeLayer - The active map layer key.
 * @param {Function} clearTripFlowFocus - Returns trip flow to the citywide overview.
 * @param {boolean} hasCorridorPin - Whether a leaderboard corridor pin is active.
 * @param {Function} clearCorridorPin - Clears the corridor pin only.
 * @param {Function} clearInfrastructureSelection - Clears the station selection.
 * @returns {Function} The deck.gl onClick handler.
 */
export default function useMapClickActions({
    activeLayer,
    clearTripFlowFocus,
    hasCorridorPin = false,
    clearCorridorPin = () => {},
    clearInfrastructureSelection,
}) {
    return useCallback((info) => {
        const pickedObject = info?.object

        // Empty-map clicks peel back trip-flow state one level: pin clears first, then focus. Picks carry an object, so never here.
        if (activeLayer === 'trip_flow') {
            if (!pickedObject) {
                if (hasCorridorPin) clearCorridorPin()
                else clearTripFlowFocus()
            }
            return
        }

        if (activeLayer !== 'infrastructure') return

        const layerId = info?.layer?.id ?? ''
        const isStationPick = layerId.startsWith('station-availability-layer') && pickedObject?.id

        if (isStationPick) return

        if (!pickedObject) {
            clearInfrastructureSelection()
        }
    }, [activeLayer, clearInfrastructureSelection, clearTripFlowFocus, hasCorridorPin, clearCorridorPin])
}
