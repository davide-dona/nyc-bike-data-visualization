import { useMemo } from 'react'
import ChartFrame from '@/components/ChartFrame.jsx'
import {
    avoidedCo2Tonnes,
    treesToAbsorb,
    peopleYearlyEquivalent,
    ledBulbHours,
    formatCompact,
} from '../utils/footprintMath.js'

// Fixed "1 icon = N" scale per row: the icon count grows with the value (never
// clamped) while each icon always stands for the same quantity. Scales differ
// per row because trees, people and bulb-hours span many orders of magnitude.
const PER_ICON = {
    trees: 250,
    people: 5,
    bulbs: 5_000_000,
}

// Icons shown for a value at a fixed per-icon scale; at least one for any
// non-zero value so a row is never blank.
function iconCount(value, perIcon) {
    if (!(value > 0)) return 0
    return Math.max(1, Math.round(value / perIcon))
}

/**
 * Pictogram translating the avoided CO2 at the user's current substitution-rate
 * setting into everyday equivalents: each row repeats its icon proportionally to
 * the value at a fixed "1 icon = N" scale, with the precise figure on the right.
 * Every factor is stated in the assumptions box (AssumptionsBox.jsx).
 * @param {Object} totals - Summed daily stats (total_distance_km).
 * @param {number} substitutionRate - Selected car-substitution rate (fraction).
 */
export default function FootprintEquivalents({ totals, substitutionRate, loading, error, onRefetch }) {
    const { rows, hasData } = useMemo(() => {
        const distanceKm = Number(totals?.total_distance_km) || 0
        const tonnesCo2 = avoidedCo2Tonnes(distanceKm, substitutionRate)

        const specs = [
            {
                key: 'trees',
                icon: 'fa-solid fa-tree',
                raw: treesToAbsorb(tonnesCo2),
                label: 'Trees to absorb it',
                suffix: '',
            },
            {
                key: 'people',
                icon: 'fa-solid fa-user',
                raw: peopleYearlyEquivalent(tonnesCo2),
                label: "People's yearly CO2",
                suffix: '',
            },
            {
                key: 'bulbs',
                icon: 'fa-solid fa-lightbulb',
                raw: ledBulbHours(tonnesCo2),
                label: 'LED bulb-hours powered',
                suffix: ' h',
            },
        ]

        return {
            hasData: tonnesCo2 > 0,
            rows: specs.map((spec) => {
                const perIcon = PER_ICON[spec.key]
                return {
                    key: spec.key,
                    icon: spec.icon,
                    perIcon,
                    iconCount: iconCount(spec.raw, perIcon),
                    value: `≈ ${formatCompact(spec.raw)}${spec.suffix}`,
                    label: spec.label,
                }
            }),
        }
    }, [totals, substitutionRate])

    return (
        <ChartFrame
            title="What that CO2 equals"
            note="Translates the avoided CO2 at your selected rate into everyday equivalents, with each icon marking a fixed share of the total."
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={hasData ? null : 'No ride data available for this filter range.'}
            autoHeight
        >
            <div className="footprint-pictogram">
                {rows.map((row) => (
                    <div key={row.key} className="footprint-pictogram__row">
                        <div className="footprint-pictogram__body">
                            <p className="footprint-pictogram__label">{row.label}</p>
                            <p className="footprint-pictogram__scale">1 icon = {formatCompact(row.perIcon)}</p>
                        </div>
                        <div className="footprint-pictogram__icons" aria-hidden="true">
                            {Array.from({ length: row.iconCount }).map((_, i) => (
                                <i key={i} className={row.icon} />
                            ))}
                        </div>
                        <p className="footprint-pictogram__value">{row.value}</p>
                    </div>
                ))}
            </div>
        </ChartFrame>
    )
}
