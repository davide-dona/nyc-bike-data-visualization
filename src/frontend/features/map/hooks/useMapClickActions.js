import { useCallback } from 'react'

/**
 * Handler hook for layer-aware map clicks: clicking empty map exits the
 * trip-flow focus or clears the infrastructure station selection, while
 * station and arc picks pass through untouched.
 * @param {string} activeLayer - The active map layer key.
 * @param {Function} clearTripFlowFocus - Returns trip flow to the citywide overview.
 * @param {Function} clearInfrastructureSelection - Clears the station selection.
 * @returns {Function} The deck.gl onClick handler.
 */
export default function useMapClickActions({ activeLayer, clearTripFlowFocus, clearInfrastructureSelection }) {
    return useCallback((info) => {
        const pickedObject = info?.object

        // Clicking empty map exits the trip-flow focus back to the overview;
        // station and arc picks carry an object, so they never clear it here.
        if (activeLayer === 'trip_flow') {
            if (!pickedObject) clearTripFlowFocus()
            return
        }

        if (activeLayer !== 'infrastructure') return

        const layerId = info?.layer?.id ?? ''
        const isStationPick = layerId.startsWith('station-availability-layer') && pickedObject?.id

        if (isStationPick) return

        if (!pickedObject) {
            clearInfrastructureSelection()
        }
    }, [activeLayer, clearInfrastructureSelection, clearTripFlowFocus])
}
