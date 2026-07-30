import { useMemo } from 'react'
import {
    avoidedCo2Tonnes,
    carTripsReplaced,
    formatCompact,
    formatTonnes,
} from '../utils/footprintMath.js'
import { FOOTPRINT_TEXT } from '../utils/footprintText.js'

/**
 * Builds the headline stat tiles (distance ridden, avoided CO2, car trips
 * replaced) from the summed totals at the selected substitution rate.
 * @param {Object} params
 * @param {Object} params.totals - Summed daily stats (total_rides, total_distance_km).
 * @param {number} params.substitutionRate - Selected car-substitution rate (fraction).
 * @returns {{tiles: Array}} Memoized tile descriptors for StatCard.
 */
export default function useFootprintTiles({ totals, substitutionRate }) {
    const ratePct = Math.round(substitutionRate * 100)

    const tiles = useMemo(() => {
        const distanceKm = Number(totals?.total_distance_km) || 0
        const totalRides = Number(totals?.total_rides) || 0
        const tonnesCo2 = avoidedCo2Tonnes(distanceKm, substitutionRate)

        return [
            {
                key: 'distance',
                value: `${formatCompact(distanceKm)} km`,
                label: FOOTPRINT_TEXT.tiles.distanceLabel,
                hint: `${formatCompact(totalRides)} total rides`,
            },
            {
                key: 'avoided',
                value: `${formatTonnes(tonnesCo2)} t CO2e`,
                label: FOOTPRINT_TEXT.tiles.avoidedLabel,
            },
            {
                key: 'trips',
                value: `≈ ${formatCompact(carTripsReplaced(totalRides, substitutionRate))}`,
                label: FOOTPRINT_TEXT.tiles.tripsLabel,
            },
        ]
    }, [totals, substitutionRate, ratePct])

    return { tiles }
}
