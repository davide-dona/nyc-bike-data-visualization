import { useMemo } from 'react'
import useChartJs from '@/hooks/useChartJs.js'
import ChartFrame from '@/components/ChartFrame.jsx'
import { buildModeComparisonBars, buildModeComparisonConfig } from '../utils/modeComparisonConfig.js'

/**
 * Horizontal bars re-expressing the period's ridden distance as CO2 per mode - a comparison, not an "avoided" claim.
 * @param {Object} totals - Summed daily stats (total_distance_km)
 */
export default function ModeComparisonBar({ totals, loading, error, onRefetch }) {
    const bars = useMemo(() => buildModeComparisonBars(totals), [totals])

    const { canvasRef } = useChartJs({
        buildConfig: () => buildModeComparisonConfig(bars),
        structuralKey: useMemo(() => JSON.stringify(bars), [bars]),
    })

    return (
        <ChartFrame
            title="Comparative Emissions by Transport Mode"
            note="Displays the estimated CO2 emissions generated if the same distance were traveled using alternative modes of transport."
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={bars.length === 0 ? 'No ride data available for this filter range.' : null}
            plotClassName="footprint-plot"
        >
            <canvas ref={canvasRef} />
        </ChartFrame>
    )
}
