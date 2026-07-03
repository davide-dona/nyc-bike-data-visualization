// Base Layer
import { createBaseTileLayer } from '../layers/base_layer/baseTileLayer.js'
// Station Usage Layer
import { createStationUsageLayer } from '../layers/station_usage_layer/stationUsageLayer.jsx'
import { useStationUsageLayer } from '../layers/station_usage_layer/useStationUsageHook.js'
// Trip Flow Layer
import { createTripFlowLayers } from '../layers/trip_flow_layer/tripFlowLayer.jsx'
import { useTripFlowLayer } from '../layers/trip_flow_layer/useTripFlowHook.js'
import { useTripStationSelection } from '../layers/trip_flow_layer/stations/useTripStationSelection.js'
// Infrastructure Layer
import { createStationAvailabilityLayer } from '../layers/infrastructure_layer/stations/stationAvailabilityLayer.jsx'
import { createBikeRoutesLayer } from '../layers/infrastructure_layer/bike_routes/bikeRoutesLayer.jsx'
import { useInfrastructureLayer } from '../layers/infrastructure_layer/useInfrastructureHook.js'
import { useInfrastructureStationSelection } from '../layers/infrastructure_layer/stations/useInfrastructureStationSelection.js'

import { useMemo, useState } from 'react'

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
export function useBuildLayers({ filters, currentTime, activeLayer, showBikeRoutes, usageMode, hiddenHealthCategories, hiddenRouteClasses }) {
    // Fetch and process data
    const { frameStations, maxUsage, maxDelta, loading: stationLoading, error: stationError, refetch: stationRefetch } = useStationUsageLayer({ filters: filters, currentTime, usageMode })
    const { selectedStationIds, onStationPick, resetSelectedStationIds } = useTripStationSelection() // Manage station selection state for trip flow layer
    const [hoveredTripStationId, setHoveredTripStationId] = useState(null)
    const { trips, maxTripFlow, stations: tripStations, loading: tripLoading, error: tripError, refetch: tripRefetch } = useTripFlowLayer({ filters, selectedStationIds })
    const { stations, bikeRoutes, loading: availabilityLoading, error: availabilityError, refetch: availabilityRefetch } = useInfrastructureLayer({ showBikeRoutes })
    const {
        clearSelectedStations: clearInfrastructureSelection,
        onStationPick: onInfrastructureStationPick,
        selectedStationIds: selectedInfrastructureStationIds,
        selectedStations: selectedInfrastructureStations,
    } = useInfrastructureStationSelection(stations)
    // State for hovered bike route segment
    const [hoveredrouteID, setHoveredrouteID] = useState(null)
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
    // Trip flow counts as ready once its clickable stations exist: arcs need a selection.
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
                    selectedStationIds,
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
                    ? bikeRoutes.filter((f) => !hiddenRouteClasses.has(f.facilityClass))
                    : bikeRoutes
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
    }, [frameStations, maxUsage, maxDelta, trips, maxTripFlow, tripStations, selectedStationIds, hoveredTripStationId, onStationPick, stations, activeLayer, stationLoading, stationError, tripLoading, tripError, availabilityLoading, availabilityError, bikeRoutes, showBikeRoutes, hoveredrouteID, selectedInfrastructureStationIds, onInfrastructureStationPick, hiddenHealthCategories, hiddenRouteClasses])

    // Consider the loading, error, and data states of only the active layer for the overall status
    const activeLayerState = stateLayers.find(layer => layer.layer === activeLayer)
    const loading = activeLayerState?.loading || false
    const error = activeLayerState?.error || null
    const refetch = activeLayerState?.refetch ?? (() => {})
    const hasData = activeLayerState?.hasData ?? false
    const hasTripFlowSelection = selectedStationIds.length > 0

    return {
        layers,
        loading: loading,
        error: error,
        hasData,
        refetch,
        resetSelectedStationIds,
        hasTripFlowSelection,
        selectedInfrastructureStations,
        clearInfrastructureSelection,
    }
}