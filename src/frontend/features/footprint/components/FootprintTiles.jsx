import StatusMessage from '../../../components/StatusMessage.jsx'
import StatCard from '@/components/StatCard.jsx'
import useFootprintTiles from '../hooks/useFootprintTiles.js'

/**
 * Headline stat tiles: distance ridden, avoided CO2, and car trips replaced,
 * all at the selected substitution rate.
 * @param {Object} totals - Summed daily stats (total_rides, total_distance_km)
 * @param {number} substitutionRate - Selected car-substitution rate (fraction)
 */
export default function FootprintTiles({ totals, substitutionRate, loading, error, onRefetch }) {
    const { tiles } = useFootprintTiles({ totals, substitutionRate })

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
