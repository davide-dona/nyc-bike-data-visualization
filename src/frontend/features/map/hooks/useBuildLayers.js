import { useCallback, useMemo } from 'react'
// Station Usage Layer
import { useStationUsageLayer } from './useStationUsageLayer.js'
// Trip Flow Layer
import { useTripFlowLayer } from './useTripFlowLayer.js'
import { useTripStationFocus } from './useTripStationFocus.js'
import { useTripCorridorPin } from './useTripCorridorPin.js'
import { useTripFlowDirection } from './useTripFlowDirection.js'
// Infrastructure Layer
import { useInfrastructureLayer } from './useInfrastructureLayer.js'
import { useInfrastructureStationSelection } from './useInfrastructureStationSelection.js'
import useLayerHoverState from './useLayerHoverState.js'
import { filterRoutesByYear } from '../utils/routeYearFilter.js'
import { buildDeckLayers } from '../utils/buildDeckLayers.js'
import { selectMapInsights } from '../utils/selectMapInsights.js'
import { rankCorridors } from '../utils/insightSelectors.js'
import { selectFlowBounds } from '../utils/tripArcsSelector.js'
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
    // Fetch and process data
    const { stations: usageStations, frameStations, maxUsage, maxDelta, loading: stationLoading, error: stationError, refetch: stationRefetch } = useStationUsageLayer({ filters: filters, currentTime, usageMode })
    const { focusedStationId, onStationPick, clearFocus } = useTripStationFocus() // Single focused station for the trip flow layer
    const { pinnedCorridorKey, toggleCorridorPin, clearCorridorPin } = useTripCorridorPin({ focusedStationId })
    const { tripDirection, setTripDirection } = useTripFlowDirection({ focusedStationId })
    const { trips, maxTripFlow, isFocusView, stations: tripStations, loading: tripLoading, error: tripError, refetch: tripRefetch } = useTripFlowLayer({ filters, focusedStationId, tripDirection })
    const { stations, bikeRoutes, loading: availabilityLoading, error: availabilityError, refetch: availabilityRefetch, routesLoading, routesError, refetchRoutes } = useInfrastructureLayer({ showBikeRoutes })
    const {
        clearSelectedStations: clearInfrastructureSelection,
        onStationPick: onInfrastructureStationPick,
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

    // Historical view: keep only the segments active in the selected year.
    // Memoized so scrubbing the year slider stays a cheap array pass.
    const yearFilteredRoutes = useMemo(
        () => filterRoutesByYear(bikeRoutes, selectedYear),
        [bikeRoutes, selectedYear],
    )

    // The corridors listed in the insights panel are emphasized on the map so
    // the strongest ones pop out of the overview web. Focus view keeps its
    // diverging colors, so no emphasis set there.
    const emphasizedCorridorKeys = useMemo(() => {
        if (isFocusView || trips.length === 0) return null
        return new Set(rankCorridors(trips, TRIP_FLOW_LIST_SIZE).map((row) => row.key))
    }, [trips, isFocusView])

    // Combine loading, error, and data-arrival states for easier handling in the component.
    // hasData is derived from the source arrays (not the deck.gl layer instances) so the
    // page can tell "still waiting on data" apart from "loaded but layer not built yet".
    // Trip flow counts as ready once its clickable stations exist; overview arcs and
    // focus arcs arrive through their own query states.
    const stateLayers = [
        { layer: 'station_usage', loading: stationLoading, error: stationError, refetch: stationRefetch, hasData: frameStations.length > 0 },
        { layer: 'trip_flow', loading: tripLoading, error: tripError, refetch: tripRefetch, hasData: tripStations.length > 0 },
        { layer: 'infrastructure', loading: availabilityLoading, error: availabilityError, refetch: availabilityRefetch, hasData: stations.length > 0 }
    ]

    // Build layers based on active layer and data
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

    // Station name for the focus-mode chart title; the trip station list
    // carries id and name for every clickable dot.
    const focusedTripStation = useMemo(
        () => tripStations.find((station) => station.id === focusedStationId) ?? null,
        [tripStations, focusedStationId],
    )

    // Per-layer data slices for the insights panel under the map. Memoized as
    // one stable bundle so consumers can depend on it without new object
    // identities leaking into other hooks' dependency arrays every render.
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

    // Hover link between insight-panel corridor rows and map arcs. Bundled
    // separately from `insights` so hover changes never recompute that memo.
    const tripFlowHover = useMemo(() => ({
        hoveredCorridorKey,
        onCorridorHover: setHoveredCorridor,
    }), [hoveredCorridorKey, setHoveredCorridor])

    // Pin link between leaderboard rows and map arcs: a row click pins its
    // corridor while the camera stays put and other arcs dim.
    const tripFlowPin = useMemo(() => ({
        pinnedCorridorKey,
        onCorridorToggle: toggleCorridorPin,
    }), [pinnedCorridorKey, toggleCorridorPin])

    // Daily-flow bounds of the drawn overview corridors, for the legend's
    // volume-gradient labeling. Focus view uses the diverging legend instead.
    const tripFlowBounds = useMemo(
        () => (isFocusView ? null : selectFlowBounds(trips)),
        [trips, isFocusView],
    )

    // Consider the loading, error, and data states of only the active layer for the overall status
    const activeLayerState = stateLayers.find(layer => layer.layer === activeLayer)
    const loading = activeLayerState?.loading || false
    const error = activeLayerState?.error || null
    const refetch = activeLayerState?.refetch ?? (() => {})
    const hasData = activeLayerState?.hasData ?? false
    const hasTripFlowFocus = Boolean(focusedStationId)

    // Reset View and empty-map clicks return the layer to its default state:
    // focus and corridor pin are cleared together.
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
        // Unfiltered routes, for deriving the year slider bounds
        bikeRoutes,
        // Per-layer data slices for the insights panel
        insights,
        // Corridor hover link shared by the insights panel and the arc layer
        tripFlowHover,
        // Corridor pin link shared by the leaderboard and the arc layer
        tripFlowPin,
        clearCorridorPin,
        // Direction filter of the trip-flow focus view
        tripDirection,
        setTripDirection,
        // Volume bounds of the drawn overview corridors, for the legend
        tripFlowBounds,
        // Trip flow query state and rows, for the focus camera
        tripLoading,
        trips,
    }
}
