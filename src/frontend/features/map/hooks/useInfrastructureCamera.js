import { useEffect, useRef } from 'react'
import { computeStationsBounds, fitViewForBounds, MAX_FIT_ZOOM } from '../utils/cameraBounds.js'
import { INITIAL_VIEW_STATE } from '../utils/mapConfig.js'

// Fallback viewport size when the map shell has not been measured yet.
const FALLBACK_VIEWPORT = { width: 1200, height: 800 }

// Zoom for a single selected station; matches the fitted-view ceiling so a
// lone station and a tight multi-selection land at the same scale.
const SINGLE_STATION_ZOOM = MAX_FIT_ZOOM

/**
 * Handler hook driving the infrastructure camera: selecting a station flies
 * the map in to it, a multi-selection is framed by its bounds, and clearing
 * the selection flies back to the initial citywide view. Each distinct
 * selection triggers exactly one flight.
 * @param {Object} params - Hook parameters.
 * @param {string} params.activeLayer - The active map layer key.
 * @param {Array} params.selectedStations - Selected station objects with coordinates.
 * @param {Function} params.flyTo - Animated camera setter from useMapHandler.
 * @param {Object} params.mapShellRef - Ref to the map shell element, for viewport size.
 */
export function useInfrastructureCamera({
    activeLayer,
    selectedStations,
    flyTo,
    mapShellRef,
}) {
    const lastFlownSelectionRef = useRef(null)

    useEffect(() => {
        if (activeLayer !== 'infrastructure') {
            // Selection clears off-layer (see useInfrastructureStationSelection),
            // so forget the last flight instead of flying back under another layer.
            lastFlownSelectionRef.current = null
            return
        }

        // Selection cleared: return to the citywide view once, if a flight happened.
        if (selectedStations.length === 0) {
            if (lastFlownSelectionRef.current !== null) {
                lastFlownSelectionRef.current = null
                flyTo(INITIAL_VIEW_STATE)
            }
            return
        }

        const selectionKey = selectedStations.map((station) => station.id).sort().join('|')
        if (lastFlownSelectionRef.current === selectionKey) return

        if (selectedStations.length === 1) {
            const [station] = selectedStations
            if (!Number.isFinite(station.longitude) || !Number.isFinite(station.latitude)) return
            lastFlownSelectionRef.current = selectionKey
            flyTo({ longitude: station.longitude, latitude: station.latitude, zoom: SINGLE_STATION_ZOOM })
            return
        }

        const bounds = computeStationsBounds(selectedStations)
        if (!bounds) return
        const shell = mapShellRef?.current
        const viewport = shell
            ? { width: shell.clientWidth, height: shell.clientHeight }
            : FALLBACK_VIEWPORT
        lastFlownSelectionRef.current = selectionKey
        flyTo(fitViewForBounds(bounds, viewport))
    }, [activeLayer, selectedStations, flyTo, mapShellRef])
}
