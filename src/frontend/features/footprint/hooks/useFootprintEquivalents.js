import { useMemo } from 'react'
import { buildEquivalentRows } from '../utils/footprintEquivalents.js'

/**
 * Memoizes the everyday-equivalent pictogram rows for the current totals and
 * substitution rate.
 * @param {Object} params
 * @param {Object} params.totals - Summed daily stats (total_distance_km).
 * @param {number} params.substitutionRate - Selected car-substitution rate (fraction).
 * @returns {{rows: Array, hasData: boolean}} Pictogram rows and whether any data exists.
 */
export default function useFootprintEquivalents({ totals, substitutionRate }) {
    return useMemo(
        () => buildEquivalentRows(totals, substitutionRate),
        [totals, substitutionRate],
    )
}
