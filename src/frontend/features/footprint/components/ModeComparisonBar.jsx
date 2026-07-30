import ChartFrame from '@/components/ChartFrame.jsx'
import useModeComparisonBar from '../hooks/useModeComparisonBar.js'
import { FOOTPRINT_TEXT } from '../utils/footprintText.js'

/**
 * Horizontal bars re-expressing the period's ridden distance as CO2 per mode - a comparison, not an "avoided" claim.
 * @param {Object} totals - Summed daily stats (total_distance_km)
 */
export default function ModeComparisonBar({ totals, loading, error, onRefetch }) {
    const { canvasRef, isEmpty } = useModeComparisonBar({ totals })

    return (
        <ChartFrame
            title={FOOTPRINT_TEXT.modeComparison.title}
            note={FOOTPRINT_TEXT.modeComparison.note}
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={isEmpty ? FOOTPRINT_TEXT.modeComparison.emptyMessage : null}
            plotClassName="footprint-plot"
        >
            <canvas ref={canvasRef} />
        </ChartFrame>
    )
}
