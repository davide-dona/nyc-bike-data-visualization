import { useMemo, useState } from 'react'
import useFootprintDaily from './useFootprintDaily.js'
import { SUBSTITUTION_RATE } from '../utils/emissionFactors.js'
import { sumFootprintTotals } from '../utils/footprintMath.js'

/**
 * Handler hook owning the FootprintPage state: substitution-rate value, the date-grouped stats fetch shared by every chart, and its summed totals.
 * @returns {Object} substitutionRate/setSubstitutionRate, dailyStats, totals, and the fetch loading/error/refetch state.
 */
export default function useFootprintPageState(filters) {
    const [substitutionRate, setSubstitutionRate] = useState(SUBSTITUTION_RATE.mid)
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
