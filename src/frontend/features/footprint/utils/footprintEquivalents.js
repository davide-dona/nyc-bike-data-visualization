import {
    avoidedCo2Tonnes,
    treesYearlyEquivalent,
    peopleYearlyEquivalent,
    ledBulbYears,
    formatCompact,
} from './footprintMath.js'
import { SUBSTITUTION_RATE } from './emissionFactors.js'

// Target icons per row; the per-icon scale is derived from the value, not hardcoded.
export const TARGET_ICONS = 24

/**
 * Rounds a raw per-icon size to a clean 1/2/5 x 10^k number so the "1 icon = N"
 * label reads nicely (e.g. 261 -> 250, 4200 -> 5000).
 * @param {number} value - Raw per-icon size.
 * @returns {number} The rounded nice scale.
 */
export function niceScale(value) {
    if (!(value > 0)) return 1
    const base = 10 ** Math.floor(Math.log10(value))
    const frac = value / base
    const nice = frac < 1.5 ? 1 : frac < 3.5 ? 2 : frac < 7.5 ? 5 : 10
    return nice * base
}

/**
 * Translates avoided CO2 into everyday yearly equivalents, one pictogram row per
 * factor, with each row's "1 icon = N" scale anchored to the mid rate.
 * @param {Object} totals - Summed daily stats (total_distance_km).
 * @param {number} substitutionRate - Selected car-substitution rate (fraction).
 * @returns {{rows: Array, hasData: boolean}} Pictogram rows and whether any data exists.
 */
export function buildEquivalentRows(totals, substitutionRate) {
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
}
