import useScatterPlot from '../hooks/useScatterPlot.js'
import StatusMessage from '@/components/StatusMessage'
import FloatingTooltip from '@/components/FloatingTooltip.jsx'
import WeatherTooltipContent from './WeatherTooltipContent.jsx'
import { WEATHER_TEXT } from '../utils/weatherText.js'

/**
 * Component for rendering a scatter plot of weather data
 * @param {{ Array }} data - Scatter data
 * @param {boolean} loading - Whether weather data is loading
 * @param {Error|null} error - Fetch error for weather data
 * @param {Function} onRefetch - Callback to trigger a retry after error
 * @returns {JSX.Element} The rendered scatter plot
 */
export default function ScatterPlot({ data, loading, error, onRefetch }) {
    const { canvasRef, tooltip, tooltipNodeRef } = useScatterPlot({ data })

    return (
        <div className="scatter-plot-frame">
            <p className="scatter-plot-frame__title">{WEATHER_TEXT.scatter.title}</p>
            <div className="scatter-plot">
                <canvas ref={canvasRef} />
                {(loading || error) && (
                    <StatusMessage loading={loading} error={error} onRefetch={onRefetch} />
                )}
            </div>
            <p className="scatter-plot-frame__note">{WEATHER_TEXT.scatter.note}</p>
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
