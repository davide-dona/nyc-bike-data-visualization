import { useCallback, useMemo } from 'react'
// Station Usage Layer
import { useStationUsageLayer } from '../station_usage/hooks/useStationUsageLayer.js'
// Trip Flow Layer
import { useTripFlowLayer } from '../trip_flow/hooks/useTripFlowLayer.js'
import { useTripStationFocus } from '../trip_flow/hooks/useTripStationFocus.js'
import { useTripCorridorPin } from '../trip_flow/hooks/useTripCorridorPin.js'
import { useTripFlowDirection } from '../trip_flow/hooks/useTripFlowDirection.js'
// Infrastructure Layer
import { useInfrastructureLayer } from '../infrastructure/hooks/useInfrastructureLayer.js'
import { useInfrastructureStationSelection } from '../infrastructure/hooks/useInfrastructureStationSelection.js'
import useLayerHoverState from './useLayerHoverState.js'
import { filterRoutesByYear } from '../infrastructure/utils/routeYearFilter.js'
import { buildDeckLayers } from '../utils/buildDeckLayers.js'
import { selectMapInsights } from '../utils/selectMapInsights.js'
import { rankCorridors } from '../utils/insightSelectors.js'
import { TRIP_FLOW_LIST_SIZE } from '@/utils/config.js'

/**
 * Orchestrating handler hook for the map page: composes the per-layer data
 * hooks, focus/selection/hover state, and the pure deck.gl layer assembly,
 * and resolves the active layer's loading/error/data status.
 * @param {Object} filters - Optional filters for fetching data, such as date range or user-selected filters.
 * @param {number} currentTime - Current hour frame (0-23) for filtering station usage data.
 * @param {string} activeLayer - The currently active map layer to determine which layers to build.
 * @param {boolean} showBikeRoutes - Whether the bike routes overlay is enabled.
 * @param {string} usageMode - Station usage mode ('all' | 'incoming' | 'outgoing').
 * @param {Set|null} hiddenHealthCategories - Health categories hidden via the legend.
 * @param {Set|null} hiddenRouteClasses - Facility classes hidden via the legend.
 * @param {number|null} selectedYear - Selected network year, null for present.
 * @returns {Object} The built layers, active-layer status, selection/focus
 * controls, unfiltered routes, and the insights bundle.
 */
export function useBuildLayers({ filters, currentTime, activeLayer, showBikeRoutes, usageMode, hiddenHealthCategories, hiddenRouteClasses, selectedYear }) {
    const { stations: usageStations, frameStations, maxUsage, maxDelta, loading: stationLoading, error: stationError, refetch: stationRefetch } = useStationUsageLayer({ filters: filters, currentTime, usageMode })
    const { focusedStationId, onStationPick, clearFocus } = useTripStationFocus()
    const { pinnedCorridorKey, toggleCorridorPin, clearCorridorPin } = useTripCorridorPin({ focusedStationId })
    const { tripDirection, setTripDirection } = useTripFlowDirection({ focusedStationId })
    const { trips, maxTripFlow, isFocusView, stations: tripStations, loading: tripLoading, error: tripError, refetch: tripRefetch } = useTripFlowLayer({ filters, focusedStationId, tripDirection })
    const { stations, bikeRoutes, loading: availabilityLoading, error: availabilityError, refetch: availabilityRefetch, routesLoading, routesError, refetchRoutes } = useInfrastructureLayer({ showBikeRoutes })
    const {
        clearSelectedStations: clearInfrastructureSelection,
        onStationPick: onInfrastructureStationPick,
        selectStation: selectInfrastructureStation,
        selectedStationIds: selectedInfrastructureStationIds,
        selectedStations: selectedInfrastructureStations,
    } = useInfrastructureStationSelection(stations, activeLayer)
    const {
        hoveredRouteId,
        hoveredTripStationId,
        hoveredInfrastructureStationId,
        hoveredCorridorKey,
        handleRoutePick,
        handleTripStationHover,
        handleInfrastructureStationHover,
        handleArcHover,
        setHoveredCorridor,
    } = useLayerHoverState()

    // Memoized so scrubbing the year slider stays a cheap array pass.
    const yearFilteredRoutes = useMemo(
        () => filterRoutesByYear(bikeRoutes, selectedYear),
        [bikeRoutes, selectedYear],
    )

    // Emphasize the top-ranked corridors on the map; focus view already uses
    // diverging colors, so it gets no emphasis set.
    const emphasizedCorridorKeys = useMemo(() => {
        if (isFocusView || trips.length === 0) return null
        return new Set(rankCorridors(trips, TRIP_FLOW_LIST_SIZE).map((row) => row.key))
    }, [trips, isFocusView])

    // hasData is derived from the source arrays, not the deck.gl layer instances, so
    // "still waiting on data" is distinct from "loaded but layer not built yet".
    const stateLayers = [
        { layer: 'station_usage', loading: stationLoading, error: stationError, refetch: stationRefetch, hasData: frameStations.length > 0 },
        { layer: 'trip_flow', loading: tripLoading, error: tripError, refetch: tripRefetch, hasData: tripStations.length > 0 },
        { layer: 'infrastructure', loading: availabilityLoading, error: availabilityError, refetch: availabilityRefetch, hasData: stations.length > 0 }
    ]

    const layers = useMemo(() => buildDeckLayers({
        activeLayer,
        stationLoading,
        stationError,
        frameStations,
        maxUsage,
        maxDelta,
        tripLoading,
        tripError,
        trips,
        maxTripFlow,
        tripStations,
        focusedStationId,
        hoveredTripStationId,
        hoveredCorridorKey,
        pinnedCorridorKey,
        emphasizedCorridorKeys,
        onTripStationPick: onStationPick,
        onTripStationHover: handleTripStationHover,
        onTripArcHover: handleArcHover,
        availabilityLoading,
        availabilityError,
        stations,
        hiddenHealthCategories,
        hiddenRouteClasses,
        yearFilteredRoutes,
        showBikeRoutes,
        hoveredRouteId,
        onRoutePick: handleRoutePick,
        selectedStationIds: selectedInfrastructureStationIds,
        hoveredInfrastructureStationId,
        onInfrastructureStationPick,
        onInfrastructureStationHover: handleInfrastructureStationHover,
    }), [frameStations, maxUsage, maxDelta, trips, maxTripFlow, tripStations, focusedStationId, hoveredTripStationId, hoveredCorridorKey, pinnedCorridorKey, emphasizedCorridorKeys, onStationPick, handleTripStationHover, handleArcHover, stations, activeLayer, stationLoading, stationError, tripLoading, tripError, availabilityLoading, availabilityError, yearFilteredRoutes, showBikeRoutes, hoveredRouteId, handleRoutePick, selectedInfrastructureStationIds, hoveredInfrastructureStationId, onInfrastructureStationPick, handleInfrastructureStationHover, hiddenHealthCategories, hiddenRouteClasses])

    // Station name for the focus-mode chart title.
    const focusedTripStation = useMemo(
        () => tripStations.find((station) => station.id === focusedStationId) ?? null,
        [tripStations, focusedStationId],
    )

    // Memoized as one stable bundle so its identity doesn't change every render.
    const insights = useMemo(() => selectMapInsights({
        usageStations,
        stationLoading,
        stationError,
        stationRefetch,
        trips,
        isFocusView,
        focusedStationName: focusedTripStation?.name ?? null,
        tripLoading,
        tripError,
        tripRefetch,
        bikeRoutes,
        yearFilteredRoutes,
        routesLoading,
        routesError,
        refetchRoutes,
    }), [
        usageStations, stationLoading, stationError, stationRefetch,
        trips, isFocusView, focusedTripStation, tripLoading, tripError, tripRefetch,
        bikeRoutes, yearFilteredRoutes, routesLoading, routesError, refetchRoutes,
    ])

    // Bundled separately from `insights` so hover changes don't recompute that memo.
    const tripFlowHover = useMemo(() => ({
        hoveredCorridorKey,
        onCorridorHover: setHoveredCorridor,
    }), [hoveredCorridorKey, setHoveredCorridor])

    const tripFlowPin = useMemo(() => ({
        pinnedCorridorKey,
        onCorridorToggle: toggleCorridorPin,
    }), [pinnedCorridorKey, toggleCorridorPin])

    const activeLayerState = stateLayers.find(layer => layer.layer === activeLayer)
    const loading = activeLayerState?.loading || false
    const error = activeLayerState?.error || null
    const refetch = activeLayerState?.refetch ?? (() => {})
    const hasData = activeLayerState?.hasData ?? false
    const hasTripFlowFocus = Boolean(focusedStationId)

    // Reset View and empty-map clicks clear focus and corridor pin together.
    const clearTripFlowFocus = useCallback(() => {
        clearFocus()
        clearCorridorPin()
    }, [clearFocus, clearCorridorPin])

    return {
        layers,
        loading: loading,
        error: error,
        hasData,
        refetch,
        clearTripFlowFocus,
        hasTripFlowFocus,
        focusedStationId,
        selectedInfrastructureStations,
        clearInfrastructureSelection,
        selectInfrastructureStation,
        bikeRoutes,
        insights,
        tripFlowHover,
        tripFlowPin,
        clearCorridorPin,
        tripDirection,
        setTripDirection,
        tripLoading,
        trips,
    }
}
