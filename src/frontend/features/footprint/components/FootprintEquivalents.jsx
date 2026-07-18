import { useMemo } from 'react'
import ChartFrame from '@/components/ChartFrame.jsx'
import {
    avoidedCo2Tonnes,
    treesYearlyEquivalent,
    peopleYearlyEquivalent,
    ledBulbYears,
    formatCompact,
} from '../utils/footprintMath.js'
import { SUBSTITUTION_RATE } from '../utils/emissionFactors.js'

// Every row aims for this many icons so the pictogram stays readable at any
// date range: the per-icon scale is derived from the value, not hardcoded.
const TARGET_ICONS = 24

// Rounds a raw per-icon size to a clean 1/2/5 x 10^k number so the "1 icon = N"
// label reads nicely (e.g. 261 -> 250, 4200 -> 5000).
function niceScale(value) {
    if (!(value > 0)) return 1
    const base = 10 ** Math.floor(Math.log10(value))
    const frac = value / base
    const nice = frac < 1.5 ? 1 : frac < 3.5 ? 2 : frac < 7.5 ? 5 : 10
    return nice * base
}

/**
 * Pictogram translating the avoided CO2 into everyday yearly equivalents: each
 * row repeats its icon proportionally to the value, with the precise figure on
 * the right. The "1 icon = N" scale is anchored to the mid substitution rate and
 * the selected date range, so the icon count stays near TARGET_ICONS whatever the
 * range length while the slider still visibly moves it. Every factor is stated in
 * the assumptions box (AssumptionsBox.jsx).
 * @param {Object} totals - Summed daily stats (total_distance_km).
 * @param {number} substitutionRate - Selected car-substitution rate (fraction).
 */
export default function FootprintEquivalents({ totals, substitutionRate, loading, error, onRefetch }) {
    const { rows, hasData } = useMemo(() => {
        const distanceKm = Number(totals?.total_distance_km) || 0
        const tonnesCo2 = avoidedCo2Tonnes(distanceKm, substitutionRate)
        // Scale reference: fixed to the mid rate so it tracks the date range, not the slider.
        const tonnesCo2Ref = avoidedCo2Tonnes(distanceKm, SUBSTITUTION_RATE.mid)

        const specs = [
            {
                key: 'trees',
                icon: 'fa-solid fa-tree',
                fn: treesYearlyEquivalent,
                label: "Trees' yearly uptake",
            },
            {
                key: 'people',
                icon: 'fa-solid fa-user',
                fn: peopleYearlyEquivalent,
                label: "People's yearly CO2",
            },
            {
                key: 'bulbs',
                icon: 'fa-solid fa-lightbulb',
                fn: ledBulbYears,
                label: 'LED bulbs for a year',
            },
        ]

        return {
            hasData: tonnesCo2 > 0,
            rows: specs.map((spec) => {
                const raw = spec.fn(tonnesCo2)
                const perIcon = niceScale(spec.fn(tonnesCo2Ref) / TARGET_ICONS)
                return {
                    key: spec.key,
                    icon: spec.icon,
                    perIcon,
                    iconCount: raw > 0 ? Math.max(1, Math.round(raw / perIcon)) : 0,
                    value: `≈ ${formatCompact(raw)}`,
                    label: spec.label,
                }
            }),
        }
    }, [totals, substitutionRate])

    return (
        <ChartFrame
            title="What that CO2 equals"
            note="Translates the avoided CO2 at your selected rate into everyday yearly equivalents, with each icon marking a share that rescales with your selected date range."
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
