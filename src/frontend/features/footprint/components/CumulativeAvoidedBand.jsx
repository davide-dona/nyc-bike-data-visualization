import Plot from 'react-plotly.js'
import ChartFrame from '@/components/ChartFrame.jsx'
import useCumulativeAvoidedBand from '../hooks/useCumulativeAvoidedBand.js'

/**
 * Cumulative avoided-CO2 band over the selected period. The low/high envelope
 * from the literature substitution rates is the primary mark; the line at the
 * user-selected rate is deliberately secondary to it. All trace/layout
 * building lives in the useCumulativeAvoidedBand handler hook.
 * @param {Array} dailyStats - GroupedStats rows from /stats/?group_by=date
 * @param {number} substitutionRate - Selected car-substitution rate (fraction)
 * @param {boolean} loading - Whether data is loading
 * @param {Error|null} error - Fetch error
 * @param {Function} onRefetch - Callback to trigger a retry after error
 */
export default function CumulativeAvoidedBand({
    dailyStats,
    substitutionRate,
    loading,
    error,
    onRefetch,
}) {
    const { traces, plotLayout, hasData } = useCumulativeAvoidedBand({ dailyStats, substitutionRate })

    return (
        <ChartFrame
            title="Cumulative CO2 avoided, low/high band"
            note="The shaded band accumulates avoided car CO2 across the plausible substitution rates. The dotted line follows your selected rate inside that envelope."
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={!hasData ? 'No daily stats available for this selection.' : null}
            plotClassName="footprint-plot"
        >
            <Plot
                data={traces}
                layout={plotLayout}
                config={{
                    displayModeBar: false,
                    scrollZoom: false,
                }}
                className="w-full h-full"
            />
        </ChartFrame>
    )
}
