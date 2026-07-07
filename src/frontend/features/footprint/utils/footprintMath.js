import { CAR_G_PER_KM, SUBSTITUTION_RATE } from './emissionFactors.js'
import { formatCount, formatNumber } from '../../../utils/numberFormat.js'

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
 * Sums the daily stat rows into the page totals. The tiles and the mode
 * comparison read plain sums of the per-date series, so one date-grouped
 * fetch serves every footprint chart.
 * @param {Array} dateRows - GroupedStats rows from /stats/?group_by=date.
 * @returns {{total_rides: number, total_distance_km: number}} Summed totals; zeros when empty.
 */
export function sumFootprintTotals(dateRows) {
    const rows = Array.isArray(dateRows) ? dateRows : []
    return rows.reduce(
        (totals, row) => ({
            total_rides: totals.total_rides + (Number(row?.total_rides) || 0),
            total_distance_km: totals.total_distance_km + (Number(row?.total_distance_km) || 0),
        }),
        { total_rides: 0, total_distance_km: 0 },
    )
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

// Single compact implementation lives in the shared util; re-exported for the tiles.
export { formatCompact } from '../../../utils/numberFormat.js'

/** Tonnes with sensible precision: whole numbers once past 100 t, one decimal below. */
export function formatTonnes(tonnes) {
    if (!Number.isFinite(tonnes)) return '-'
    if (tonnes >= 100) return formatCount(tonnes)
    return formatNumber(tonnes, 1)
}
