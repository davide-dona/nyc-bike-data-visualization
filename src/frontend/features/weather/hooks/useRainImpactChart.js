import { useMemo } from 'react'
import useChartJs from '@/hooks/useChartJs.js'
import { formatRainBuckets, buildRainImpactConfig } from '../utils/rainImpactConfig.js'

/**
 * Handler hook for the rain-impact bar chart: buckets the stats by precipitation and wires the Chart.js canvas.
 * @param {Object} params
 * @param {Array} params.data - Grouped stats bucketed by precipitation.
 * @returns {{canvasRef: Object, isEmpty: boolean}} Canvas ref and whether there are no buckets.
 */
export default function useRainImpactChart({ data }) {
    const buckets = useMemo(() => formatRainBuckets(data), [data])

    const { canvasRef } = useChartJs({
        buildConfig: () => buildRainImpactConfig(buckets),
        structuralKey: useMemo(() => JSON.stringify(buckets), [buckets]),
    })

    return { canvasRef, isEmpty: buckets.length === 0 }
}
