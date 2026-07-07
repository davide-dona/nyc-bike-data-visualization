// Base Layer
import { createBaseTileLayer } from '../utils/baseTileLayer.js'
// Station Usage Layer
import { createStationUsageLayer } from '../utils/stationUsageLayer.js'
import { useStationUsageLayer } from './useStationUsageLayer.js'
// Trip Flow Layer
import { createTripFlowLayers } from '../utils/tripFlowLayer.js'
import { useTripFlowLayer } from './useTripFlowLayer.js'
import { useTripStationFocus } from './useTripStationFocus.js'
// Infrastructure Layer
import { createStationAvailabilityLayer } from '../utils/stationAvailabilityLayer.js'
import { createBikeRoutesLayer } from '../utils/bikeRoutesLayer.js'
import { useInfrastructureLayer } from './useInfrastructureLayer.js'
import { useInfrastructureStationSelection } from './useInfrastructureStationSelection.js'

import { useMemo, useState } from 'react'
import { filterRoutesByYear } from '../utils/routeYearFilter.js'

// CartoDB Positron - subdued paper/grey basemap that lets the data layers carry
// the color weight. Same provider as Voyager, no API key required.
const BASE_TILE_URL = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'

/**
 * Function to build the layers for the map based on the active layer and the provided data. 
 * @param {Object} filters - Optional filters for fetching data, such as date range or user-selected filters.
 * @param {number} currentTime - Current hour frame (0-23) for filtering station usage data.
 * @param {string} activeLayer - The currently active map layer to determine which layers to build.
 * @returns {Object} The built layers and their status.
 */
export function useBuildLayers({ filters, currentTime, activeLayer, showBikeRoutes, usageMode, hiddenHealthCategories, hiddenRouteClasses, selectedYear }) {
    // Fetch and process data
    const { stations: usageStations, frameStations, maxUsage, maxDelta, loading: stationLoading, error: stationError, refetch: stationRefetch } = useStationUsageLayer({ filters: filters, currentTime, usageMode })
    const { focusedStationId, onStationPick, clearFocus } = useTripStationFocus() // Single focused station for the trip flow layer
    const [hoveredTripStationId, setHoveredTripStationId] = useState(null)
    const { trips, maxTripFlow, isFocusView, stations: tripStations, loading: tripLoading, error: tripError, refetch: tripRefetch } = useTripFlowLayer({ filters, focusedStationId })
    const { stations, bikeRoutes, loading: availabilityLoading, error: availabilityError, refetch: availabilityRefetch, routesLoading, routesError, refetchRoutes } = useInfrastructureLayer({ showBikeRoutes })
    const {
        clearSelectedStations: clearInfrastructureSelection,
        onStationPick: onInfrastructureStationPick,
        selectedStationIds: selectedInfrastructureStationIds,
        selectedStations: selectedInfrastructureStations,
    } = useInfrastructureStationSelection(stations)
    // State for hovered bike route segment
    const [hoveredrouteID, setHoveredrouteID] = useState(null)
    // Historical view: keep only the segments active in the selected year.
    // Memoized so scrubbing the year slider stays a cheap array pass.
    const yearFilteredRoutes = useMemo(
        () => filterRoutesByYear(bikeRoutes, selectedYear),
        [bikeRoutes, selectedYear],
    )
    const handleRoutePick = (info) => {
        const route = info?.object
        setHoveredrouteID(route?.routeID ?? route?.properties?.routeID ?? null)
    }
    const handleTripStationHover = (info) => {
        setHoveredTripStationId(info?.object?.id ?? null)
    }

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
    const layers = useMemo(() => {
        // Base tile layer is always included
        const base = [createBaseTileLayer(BASE_TILE_URL)]
        // Push the appropriate layer based on the active layer and data loading/error states
        if (activeLayer === 'station_usage') {
            if (!stationLoading && !stationError)
                base.push(createStationUsageLayer({ frameStations, maxUsage, maxDelta }))
        } 
        if (activeLayer === 'trip_flow') {
            if (!tripLoading && !tripError) {
                base.push(createTripFlowLayers({
                    trips,
                    maxTripCount: maxTripFlow,
                    stations: tripStations,
                    focusedStationId,
                    hoveredStationId: hoveredTripStationId,
                    onStationPick,
                    onStationHover: handleTripStationHover,
                }))
            }
        }
        if (activeLayer === 'infrastructure') {
            if (!availabilityLoading && !availabilityError) {
                // Legend toggles hide categories/classes from the map only; the
                // stateLayers hasData flags above keep reading the unfiltered
                // arrays so hiding everything never re-triggers the loading overlay.
                // Route segments without a legend row (unknown class) stay visible.
                const visibleStations = hiddenHealthCategories?.size
                    ? stations.filter((s) => !hiddenHealthCategories.has(s.health_category))
                    : stations
                const visibleRoutes = hiddenRouteClasses?.size
                    ? yearFilteredRoutes.filter((f) => !hiddenRouteClasses.has(f.facilityClass))
                    : yearFilteredRoutes
                if (showBikeRoutes && visibleRoutes.length > 0) {
                    base.push(createBikeRoutesLayer({ routes: visibleRoutes, hoveredrouteID: hoveredrouteID, onRoutePick: handleRoutePick }))
                }
                base.push(createStationAvailabilityLayer({
                    stations: visibleStations,
                    selectedStationIds: selectedInfrastructureStationIds,
                    onStationPick: onInfrastructureStationPick,
                }))
            }
        }

        return base
    }, [frameStations, maxUsage, maxDelta, trips, maxTripFlow, tripStations, focusedStationId, hoveredTripStationId, onStationPick, stations, activeLayer, stationLoading, stationError, tripLoading, tripError, availabilityLoading, availabilityError, yearFilteredRoutes, showBikeRoutes, hoveredrouteID, selectedInfrastructureStationIds, onInfrastructureStationPick, hiddenHealthCategories, hiddenRouteClasses])

    // Station name for the focus-mode chart title; the trip station list
    // carries id and name for every clickable dot.
    const focusedTripStation = useMemo(
        () => tripStations.find((station) => station.id === focusedStationId) ?? null,
        [tripStations, focusedStationId],
    )

    // Per-layer data slices for the insights panel under the map. Memoized as
    // one stable bundle so consumers can depend on it without new object
    // identities leaking into other hooks' dependency arrays every render.
    const insights = useMemo(() => ({
        stationUsage: {
            stations: usageStations,
            loading: stationLoading,
            error: stationError,
            refetch: stationRefetch,
        },
        tripFlow: {
            trips,
            isFocusView,
            focusedStationName: focusedTripStation?.name ?? null,
            loading: tripLoading,
            error: tripError,
            refetch: tripRefetch,
        },
        infrastructure: {
            routes: bikeRoutes,
            yearFilteredRoutes,
            // Route-only states, so the panel works while showBikeRoutes is off
            loading: routesLoading,
            error: routesError,
            refetch: refetchRoutes,
        },
    }), [
        usageStations, stationLoading, stationError, stationRefetch,
        trips, isFocusView, focusedTripStation, tripLoading, tripError, tripRefetch,
        bikeRoutes, yearFilteredRoutes, routesLoading, routesError, refetchRoutes,
    ])

    // Consider the loading, error, and data states of only the active layer for the overall status
    const activeLayerState = stateLayers.find(layer => layer.layer === activeLayer)
    const loading = activeLayerState?.loading || false
    const error = activeLayerState?.error || null
    const refetch = activeLayerState?.refetch ?? (() => {})
    const hasData = activeLayerState?.hasData ?? false
    const hasTripFlowFocus = Boolean(focusedStationId)

    return {
        layers,
        loading: loading,
        error: error,
        hasData,
        refetch,
        clearTripFlowFocus: clearFocus,
        hasTripFlowFocus,
        selectedInfrastructureStations,
        clearInfrastructureSelection,
        // Unfiltered routes, for deriving the year slider bounds
        bikeRoutes,
        // Per-layer data slices for the insights panel
        insights,
    }
}