import { useMemo } from 'react'
import {
    selectStationAvailability,
} from './stations/stationAvailabilitySelector.js'
import useStationAvailability from './stations/useStationAvailability.js'
import useBikeRoutes from './bike_routes/useBikeRoutes.js'

/**
 *  Custom hook to provide combined data for station availability and bike routes.
 *  This allows the map component to easily access both datasets and their loading/error states.
 * @param {boolean} showBikeRoutes - Whether to include bike route data in the returned object.
 * @returns 
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
        // Routes are always returned (the query runs regardless) so the year
        // slider can derive its bounds even while the map toggle is off; the
        // layer builder still gates rendering on showBikeRoutes.
        bikeRoutes,
        loading,
        error,
        refetch,
        // Route-only states, ungated by showBikeRoutes: the insights panel
        // charts routes even while the map's route toggle is off.
        routesLoading,
        routesError,
        refetchRoutes,
    }
}