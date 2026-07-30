import { useMemo, useRef } from 'react'
import { formatData } from '../utils/scatterPlot.js'
import { buildScatterPlotConfig } from '../utils/scatterPlotConfig.js'
import useScatterTooltip from './useScatterTooltip.js'
import useChartJs from '@/hooks/useChartJs.js'

/**
 * Handler hook for the weather scatter plot: derives the plotted points and wires the Chart.js canvas to the shared floating tooltip.
 * @param {Object} params
 * @param {Array} params.data - Raw weather stats rows.
 * @returns {{canvasRef: Object, tooltip: Object, tooltipNodeRef: Object}} Canvas ref plus tooltip state and node ref.
 */
export default function useScatterPlot({ data }) {
    const formattedData = useMemo(() => formatData(data), [data])
    const { tooltip, tooltipNodeRef, handleExternalTooltip } = useScatterTooltip()
    // The handler is read through a ref so the chart config never goes stale.
    const externalTooltipRef = useRef(handleExternalTooltip)
    externalTooltipRef.current = handleExternalTooltip

    const { canvasRef } = useChartJs({
        buildConfig: () =>
            buildScatterPlotConfig({
                formattedData,
                externalTooltipHandler: (context) => externalTooltipRef.current(context),
            }),
        structuralKey: useMemo(() => JSON.stringify(formattedData), [formattedData]),
    })

    return { canvasRef, tooltip, tooltipNodeRef }
}
