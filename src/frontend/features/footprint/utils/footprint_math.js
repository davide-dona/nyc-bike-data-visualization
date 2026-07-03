import { CAR_G_PER_KM, SUBSTITUTION_RATE } from './emission_factors.js'

const GRAMS_PER_TONNE = 1_000_000

/** Convert a distance to the tonnes of CO2e the same km would emit for a per-km factor. */
export function kmToCo2Tonnes(distanceKm, gPerKm) {
    return (distanceKm * gPerKm) / GRAMS_PER_TONNE
}

/** Tonnes of car CO2e avoided by the given distance at one substitution rate. */
export function avoidedCo2Tonnes(distanceKm, substitutionRate) {
    return kmToCo2Tonnes(distanceKm * substitutionRate, CAR_G_PER_KM)
}

/** The honest low–high envelope of avoided tonnes for a distance, from the literature rates. */
export function avoidedCo2Range(distanceKm) {
    return {
        low: avoidedCo2Tonnes(distanceKm, SUBSTITUTION_RATE.low),
        high: avoidedCo2Tonnes(distanceKm, SUBSTITUTION_RATE.high),
    }
}

/** Number of car trips replaced when a share of rides substitutes a car trip. */
export function carTripsReplaced(totalRides, substitutionRate) {
    return totalRides * substitutionRate
}

/**
 * Builds the cumulative avoided-CO2 series for the band chart.
 * @param {Array} dateRows - GroupedStats rows from /stats/?group_by=date.
 * @param {number} substitutionRate - The user-selected substitution rate for the mid line.
 * @returns {{dates: string[], low: number[], mid: number[], high: number[]}} Cumulative tonnes per day.
 */
export function buildCumulativeAvoidedSeries(dateRows, substitutionRate) {
    const rows = Array.isArray(dateRows) ? dateRows : []
    const sortedRows = [...rows]
        .filter((row) => row?.date && Number.isFinite(Number(row.total_distance_km)))
        .sort((a, b) => String(a.date).localeCompare(String(b.date)))

    const series = { dates: [], low: [], mid: [], high: [] }
    let cumulativeKm = 0
    for (const row of sortedRows) {
        cumulativeKm += Number(row.total_distance_km)
        series.dates.push(String(row.date))
        series.low.push(avoidedCo2Tonnes(cumulativeKm, SUBSTITUTION_RATE.low))
        series.mid.push(avoidedCo2Tonnes(cumulativeKm, substitutionRate))
        series.high.push(avoidedCo2Tonnes(cumulativeKm, SUBSTITUTION_RATE.high))
    }
    return series
}

const COMPACT_FORMAT = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

/** Compact human form for large counts: 22282082 -> "22.3M". */
export function formatCompact(value) {
    if (!Number.isFinite(value)) return '-'
    return COMPACT_FORMAT.format(value)
}

/** Tonnes with sensible precision: whole numbers once past 100 t, one decimal below. */
export function formatTonnes(tonnes) {
    if (!Number.isFinite(tonnes)) return '-'
    if (tonnes >= 100) return Math.round(tonnes).toLocaleString('en-US')
    return tonnes.toFixed(1)
}
