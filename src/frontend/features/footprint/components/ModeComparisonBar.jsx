import { useMemo } from 'react'
import useChartJs from '@/hooks/useChartJs.js'
import ChartFrame from '@/components/ChartFrame.jsx'
import { buildModeComparisonBars, buildModeComparisonConfig } from '../utils/modeComparisonConfig.js'

/**
 * Horizontal bars re-expressing the period's total ridden distance as the CO2
 * the same travel would emit per mode. This is deliberately NOT an "avoided"
 * claim: it answers "what would the same kilometres emit by other modes".
 * @param {Object} totals - Summed daily stats (total_distance_km)
 * @param {boolean} loading - Whether data is loading
 * @param {Error|null} error - Fetch error
 * @param {Function} onRefetch - Callback to trigger a retry after error
 */
export default function ModeComparisonBar({ totals, loading, error, onRefetch }) {
    const bars = useMemo(() => buildModeComparisonBars(totals), [totals])

    const { canvasRef } = useChartJs({
        buildConfig: () => buildModeComparisonConfig(bars),
        structuralKey: useMemo(() => JSON.stringify(bars), [bars]),
    })

    return (
        <ChartFrame
            title="Same kilometres, different footprint"
            note="Restates the period's ridden kilometres as the CO2 each transport mode would emit for that distance. Longer bars mean dirtier modes, not avoided emissions."
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={bars.length === 0 ? 'No ride data available for this filter range.' : null}
            plotClassName="footprint-plot"
        >
            <canvas ref={canvasRef} />
        </ChartFrame>
    )
}
