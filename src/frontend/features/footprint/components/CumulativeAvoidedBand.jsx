import Plot from 'react-plotly.js'
import ChartFrame from '@/components/ChartFrame.jsx'
import useCumulativeAvoidedBand from '../hooks/useCumulativeAvoidedBand.js'
import { FOOTPRINT_TEXT } from '../utils/footprintText.js'

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
            title={FOOTPRINT_TEXT.cumulativeBand.title}
            note={FOOTPRINT_TEXT.cumulativeBand.note}
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={!hasData ? FOOTPRINT_TEXT.cumulativeBand.emptyMessage : null}
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
