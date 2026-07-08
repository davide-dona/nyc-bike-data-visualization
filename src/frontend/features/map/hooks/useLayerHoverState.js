import { useCallback, useState } from 'react'

/**
 * Handler hook for per-layer hover state: the hovered bike-route segment on
 * the infrastructure layer, and the hovered station dot and corridor arc on
 * the trip flow layer. The corridor key is shared with the insights panel so
 * hovering an arc or its ranked row highlights the same corridor everywhere.
 * @returns {Object} Hover ids/keys and their deck.gl pick handlers.
 */
export default function useLayerHoverState() {
    // State for hovered bike route segment
    const [hoveredRouteId, setHoveredRouteId] = useState(null)
    const [hoveredTripStationId, setHoveredTripStationId] = useState(null)
    const [hoveredCorridorKey, setHoveredCorridorKey] = useState(null)

    const handleRoutePick = useCallback((info) => {
        const route = info?.object
        setHoveredRouteId(route?.routeID ?? route?.properties?.routeID ?? null)
    }, [])

    const handleTripStationHover = useCallback((info) => {
        setHoveredTripStationId(info?.object?.id ?? null)
    }, [])

    // deck.gl pick handler for corridor arcs on the map.
    const handleArcHover = useCallback((info) => {
        setHoveredCorridorKey(info?.object?.corridor_key ?? null)
    }, [])

    // Plain setter for insight-panel rows, which pass the key directly.
    const setHoveredCorridor = useCallback((key) => {
        setHoveredCorridorKey(key ?? null)
    }, [])

    return {
        hoveredRouteId,
        hoveredTripStationId,
        hoveredCorridorKey,
        handleRoutePick,
        handleTripStationHover,
        handleArcHover,
        setHoveredCorridor,
    }
}
