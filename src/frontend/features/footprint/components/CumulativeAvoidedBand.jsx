import Plot from 'react-plotly.js'
import ChartFrame from '@/components/ChartFrame.jsx'
import useCumulativeAvoidedBand from '../hooks/useCumulativeAvoidedBand.js'

/**
 * Cumulative avoided-CO2 band: the low/high substitution envelope is the primary mark, the selected-rate line secondary. Trace/layout building lives in useCumulativeAvoidedBand.
 * @param {Array} dailyStats - GroupedStats rows from /stats/?group_by=date
 * @param {number} substitutionRate - Selected car-substitution rate (fraction)
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
