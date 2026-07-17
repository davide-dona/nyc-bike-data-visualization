import { useMemo, useRef } from 'react'
import { formatData } from '../utils/scatterPlot.js'
import { buildScatterPlotConfig } from '../utils/scatterPlotConfig.js'
import useScatterTooltip from '../hooks/useScatterTooltip.js'
import useChartJs from '@/hooks/useChartJs.js'
import StatusMessage from '@/components/StatusMessage'
import FloatingTooltip from '@/components/FloatingTooltip.jsx'
import WeatherTooltipContent from './WeatherTooltipContent.jsx'

/**
 * Component for rendering a scatter plot of weather data
 * @param {{ Array }} data - Scatter data
 * @param {boolean} loading - Whether weather data is loading
 * @param {Error|null} error - Fetch error for weather data
 * @param {Function} onRefetch - Callback to trigger a retry after error
 * @returns {JSX.Element} The rendered scatter plot
 */
export default function ScatterPlot({ data, loading, error, onRefetch }) {
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

    return (
        <div className="scatter-plot-frame">
            <p className="scatter-plot-frame__title">Weather conditions - speed vs trip frequency</p>
            <div className="scatter-plot">
                <canvas ref={canvasRef} />
                {(loading || error) && (
                    <StatusMessage loading={loading} error={error} onRefetch={onRefetch} />
                )}
            </div>
            <p className="scatter-plot-frame__note">
                The placement and coloring of the points reveal how different weather conditions affect rider behavior. Hover over any point to see its exact weather conditions and metrics.
            </p>
            {tooltip.point && (
                <FloatingTooltip
                    visible={tooltip.visible}
                    position={tooltip.position}
                    nodeRef={tooltipNodeRef}
                    className="weather-tooltip-frame"
                >
                    <WeatherTooltipContent point={tooltip.point} />
                </FloatingTooltip>
            )}
        </div>
    )
}
