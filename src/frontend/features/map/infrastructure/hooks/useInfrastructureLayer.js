import { useMemo } from 'react'
import {
    selectStationAvailability,
} from '../utils/stationAvailabilitySelector.js'
import useStationAvailability from '../../hooks/useStationAvailability.js'
import useBikeRoutes from './useBikeRoutes.js'

/**
 * Combines station availability and bike-route data with their loading/error state.
 * @param {boolean} showBikeRoutes - Whether to include bike route data in the returned object.
 */
export function useInfrastructureLayer({ showBikeRoutes = false } = {}) {
    const { stationData, loading: stationsLoading, error: stationsError, refetch: refetchStations } = useStationAvailability()
    const { bikeRoutes, loading: routesLoading, error: routesError, refetch: refetchRoutes } = useBikeRoutes()

    const stations = useMemo(() => selectStationAvailability(stationData), [stationData])

    // Combine loading/error: if routes are toggled off, their state is irrelevant
    const loading = stationsLoading || (showBikeRoutes && routesLoading)
    const error = stationsError || (showBikeRoutes ? routesError : null)
    const refetch = () => {
        if (showBikeRoutes) {
            return Promise.all([refetchStations(), refetchRoutes()])
        }
        return refetchStations()
    }

    return {
        stations,
        // Routes are always returned so the year slider can derive bounds even when the map toggle is off.
        bikeRoutes,
        loading,
        error,
        refetch,
        // Route-only states, ungated by showBikeRoutes: the insights panel charts routes regardless.
        routesLoading,
        routesError,
        refetchRoutes,
    }
}