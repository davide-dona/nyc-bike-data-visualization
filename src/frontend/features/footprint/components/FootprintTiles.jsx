import { useMemo } from 'react'
import StatusMessage from '../../../components/StatusMessage.jsx'
import StatCard from '@/components/StatCard.jsx'
import { SUBSTITUTION_RATE } from '../utils/emissionFactors.js'
import {
    avoidedCo2Range,
    avoidedCo2Tonnes,
    carTripsReplaced,
    formatCompact,
    formatTonnes,
} from '../utils/footprintMath.js'

/**
 * Headline stat tiles: distance ridden, avoided CO2 (always a range), and car
 * trips replaced at the selected substitution rate.
 * @param {Object} totals - Summed daily stats (total_rides, total_distance_km)
 * @param {number} substitutionRate - Selected car-substitution rate (fraction)
 * @param {boolean} loading - Whether data is loading
 * @param {Error|null} error - Fetch error
 * @param {Function} onRefetch - Callback to trigger a retry after error
 */
export default function FootprintTiles({ totals, substitutionRate, loading, error, onRefetch }) {
    const ratePct = Math.round(substitutionRate * 100)

    const tiles = useMemo(() => {
        const distanceKm = Number(totals?.total_distance_km) || 0
        const totalRides = Number(totals?.total_rides) || 0
        const range = avoidedCo2Range(distanceKm)
        const midTonnes = avoidedCo2Tonnes(distanceKm, substitutionRate)
        const lowPct = Math.round(SUBSTITUTION_RATE.low * 100)
        const highPct = Math.round(SUBSTITUTION_RATE.high * 100)

        return [
            {
                key: 'distance',
                value: `${formatCompact(distanceKm)} km`,
                label: 'Distance ridden',
                hint: `${formatCompact(totalRides)} rides in the selected period`,
            },
            {
                key: 'avoided',
                value: `${formatTonnes(range.low)}–${formatTonnes(range.high)} t CO2e`,
                label: 'Avoided (range)',
                hint: `≈ ${formatTonnes(midTonnes)} t at your ${ratePct}% setting (range spans ${lowPct}–${highPct}%)`,
            },
            {
                key: 'trips',
                value: `≈ ${formatCompact(carTripsReplaced(totalRides, substitutionRate))}`,
                label: 'Car trips replaced',
                hint: `At the selected ${ratePct}% substitution rate`,
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
