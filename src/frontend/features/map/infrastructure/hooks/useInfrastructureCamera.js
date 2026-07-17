import { useEffect, useRef } from 'react'
import { MAX_FIT_ZOOM } from '../../utils/cameraBounds.js'
import { INITIAL_VIEW_STATE } from '../../utils/mapConfig.js'

// Zoom for the selected station; matches the map's fitted-view ceiling.
const SINGLE_STATION_ZOOM = MAX_FIT_ZOOM

/**
 * Handler hook driving the infrastructure camera: selecting a station flies
 * the map in to it, and clearing the selection flies back to the initial
 * citywide view. Each distinct selection triggers exactly one flight.
 * @param {Object} params - Hook parameters.
 * @param {string} params.activeLayer - The active map layer key.
 * @param {Array} params.selectedStations - Selected station objects with coordinates (0 or 1 entries).
 * @param {Function} params.flyTo - Animated camera setter from useMapHandler.
 */
export function useInfrastructureCamera({
    activeLayer,
    selectedStations,
    flyTo,
}) {
    const lastFlownStationIdRef = useRef(null)

    useEffect(() => {
        if (activeLayer !== 'infrastructure') {
            // Selection clears off-layer, so just forget the last flight instead of flying back.
            lastFlownStationIdRef.current = null
            return
        }

        const station = selectedStations[0] ?? null

        // Selection cleared: return to the citywide view once, if a flight happened.
        if (!station) {
            if (lastFlownStationIdRef.current !== null) {
                lastFlownStationIdRef.current = null
                flyTo(INITIAL_VIEW_STATE)
            }
            return
        }

        if (lastFlownStationIdRef.current === station.id) return
        if (!Number.isFinite(station.longitude) || !Number.isFinite(station.latitude)) return

        lastFlownStationIdRef.current = station.id
        flyTo({ longitude: station.longitude, latitude: station.latitude, zoom: SINGLE_STATION_ZOOM })
    }, [activeLayer, selectedStations, flyTo])
}
