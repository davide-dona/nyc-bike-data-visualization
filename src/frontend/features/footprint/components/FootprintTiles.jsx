import { useMemo } from 'react'
import StatusMessage from '../../../components/StatusMessage.jsx'
import StatCard from '@/components/StatCard.jsx'
import {
    avoidedCo2Tonnes,
    carTripsReplaced,
    formatCompact,
    formatTonnes,
} from '../utils/footprintMath.js'

/**
 * Headline stat tiles: distance ridden, avoided CO2, and car trips replaced,
 * all at the selected substitution rate.
 * @param {Object} totals - Summed daily stats (total_rides, total_distance_km)
 * @param {number} substitutionRate - Selected car-substitution rate (fraction)
 */
export default function FootprintTiles({ totals, substitutionRate, loading, error, onRefetch }) {
    const ratePct = Math.round(substitutionRate * 100)

    const tiles = useMemo(() => {
        const distanceKm = Number(totals?.total_distance_km) || 0
        const totalRides = Number(totals?.total_rides) || 0
        const tonnesCo2 = avoidedCo2Tonnes(distanceKm, substitutionRate)

        return [
            {
                key: 'distance',
                value: `${formatCompact(distanceKm)} km`,
                label: 'Distance ridden',
                hint: `${formatCompact(totalRides)} total rides`,
            },
            {
                key: 'avoided',
                value: `${formatTonnes(tonnesCo2)} t CO2e`,
                label: 'Avoided',
                    },
            {
                key: 'trips',
                value: `≈ ${formatCompact(carTripsReplaced(totalRides, substitutionRate))}`,
                label: 'Car trips replaced',
            },
        ]
    }, [totals, substitutionRate, ratePct])

    return (
        <div className="footprint-tiles">
            {tiles.map((tile) => (
                <StatCard key={tile.key} size="lg" value={tile.value} label={tile.label} hint={tile.hint} />
            ))}
            {(loading || error) && (
                <StatusMessage loading={loading} error={error} onRefetch={onRefetch} />
            )}
        </div>
    )
}
