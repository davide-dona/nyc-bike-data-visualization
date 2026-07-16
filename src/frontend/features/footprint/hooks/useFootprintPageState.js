import { useMemo, useState } from 'react'
import useFootprintDaily from './useFootprintDaily.js'
import { SUBSTITUTION_RATE } from '../utils/emissionFactors.js'
import { sumFootprintTotals } from '../utils/footprintMath.js'

/**
 * Handler hook owning the FootprintPage state: the substitution-rate slider
 * value, the date-grouped stats fetch that serves every chart, and the
 * summed totals derived from it.
 * @param {Object} filters - The page filters.
 * @returns {Object} substitutionRate/setSubstitutionRate, dailyStats, totals, and the fetch loading/error/refetch state.
 */
export default function useFootprintPageState(filters) {
    // Assumed share of rides replacing a car trip; drives tiles and band alike
    const [substitutionRate, setSubstitutionRate] = useState(SUBSTITUTION_RATE.mid)
    // One date-grouped fetch serves every chart; the totals are its sums
    const { dailyStats, loading, error, refetch } = useFootprintDaily(filters)
    const totals = useMemo(() => sumFootprintTotals(dailyStats), [dailyStats])

    return {
        substitutionRate,
        setSubstitutionRate,
        dailyStats,
        totals,
        loading,
        error,
        refetch,
    }
}
