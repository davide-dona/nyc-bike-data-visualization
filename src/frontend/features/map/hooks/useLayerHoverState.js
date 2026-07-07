import { useState } from 'react'

/**
 * Handler hook for per-layer hover state: the hovered bike-route segment on
 * the infrastructure layer and the hovered station dot on the trip flow layer.
 * @returns {Object} hoveredRouteId, hoveredTripStationId, and their deck.gl pick handlers.
 */
export default function useLayerHoverState() {
    // State for hovered bike route segment
    const [hoveredRouteId, setHoveredRouteId] = useState(null)
    const [hoveredTripStationId, setHoveredTripStationId] = useState(null)

    const handleRoutePick = (info) => {
        const route = info?.object
        setHoveredRouteId(route?.routeID ?? route?.properties?.routeID ?? null)
    }

    const handleTripStationHover = (info) => {
        setHoveredTripStationId(info?.object?.id ?? null)
    }

    return {
        hoveredRouteId,
        hoveredTripStationId,
        handleRoutePick,
        handleTripStationHover,
    }
}
