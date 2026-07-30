import { useMemo } from 'react'
import useChartJs from '@/hooks/useChartJs.js'
import { buildModeComparisonBars, buildModeComparisonConfig } from '../utils/modeComparisonConfig.js'

/**
 * Wires the mode-comparison Chart.js canvas: derives the per-mode bars from the
 * totals and (re)builds the chart when their structure changes.
 * @param {Object} params
 * @param {Object} params.totals - Summed daily stats (total_distance_km).
 * @returns {{canvasRef: Object, isEmpty: boolean}} Canvas ref and whether there are no bars.
 */
export default function useModeComparisonBar({ totals }) {
    const bars = useMemo(() => buildModeComparisonBars(totals), [totals])

    const { canvasRef } = useChartJs({
        buildConfig: () => buildModeComparisonConfig(bars),
        structuralKey: useMemo(() => JSON.stringify(bars), [bars]),
    })

    return { canvasRef, isEmpty: bars.length === 0 }
}
