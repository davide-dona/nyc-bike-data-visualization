import { useMemo } from 'react'
import StatusMessage from '../../../components/StatusMessage.jsx'
import StatCard from '@/components/StatCard.jsx'
import {
    avoidedCo2Tonnes,
    treesToAbsorb,
    peopleYearlyEquivalent,
    ledBulbHours,
    formatCompact,
} from '../utils/footprintMath.js'

/**
 * Three "what that CO2 equals" cards, translating the avoided CO2 at the
 * user's current substitution-rate setting into everyday equivalents. Same
 * StatCard style as the headline tiles above; every factor is stated in the
 * assumptions box (AssumptionsBox.jsx).
 * @param {Object} totals - Summed daily stats (total_distance_km).
 * @param {number} substitutionRate - Selected car-substitution rate (fraction).
 */
export default function FootprintEquivalents({ totals, substitutionRate, loading, error, onRefetch }) {
    const tiles = useMemo(() => {
        const distanceKm = Number(totals?.total_distance_km) || 0
        const tonnesCo2 = avoidedCo2Tonnes(distanceKm, substitutionRate)

        return [
            {
                key: 'trees',
                value: `≈ ${formatCompact(treesToAbsorb(tonnesCo2))}`,
                label: 'Trees to absorb it',
                hint: 'urban trees grown 10 years',
            },
            {
                key: 'people',
                value: `≈ ${formatCompact(peopleYearlyEquivalent(tonnesCo2))}`,
                label: "People's yearly CO2",
                hint: 'global average person',
            },
            {
                key: 'bulbs',
                value: `≈ ${formatCompact(ledBulbHours(tonnesCo2))} h`,
                label: 'LED bulb-hours powered',
                hint: '9W LED on the average US grid',
            },
        ]
    }, [totals, substitutionRate])

    return (
        <section className="footprint-equivalents">
            <p className="footprint-equivalents__heading">What that CO2 equals</p>
            <div className="footprint-tiles">
                {tiles.map((tile) => (
                    <StatCard key={tile.key} size="lg" value={tile.value} label={tile.label} hint={tile.hint} />
                ))}
            </div>
            {(loading || error) && (
                <StatusMessage loading={loading} error={error} onRefetch={onRefetch} />
            )}
        </section>
    )
}
