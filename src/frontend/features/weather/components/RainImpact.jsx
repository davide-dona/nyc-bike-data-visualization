import ChartFrame from '@/components/ChartFrame.jsx'
import useRainImpactChart from '../hooks/useRainImpactChart.js'
import { WEATHER_TEXT } from '../utils/weatherText.js'

/**
 * Bar chart of ridership per precipitation bucket, relative to the dry-weather
 * baseline (dry = 100%).
 * @param {Array} data - Grouped stats bucketed by precipitation
 * @param {boolean} loading - Whether data is loading
 * @param {Error|null} error - Fetch error
 * @param {Function} onRefetch - Callback to trigger a retry after error
 */
export default function RainImpact({ data, loading, error, onRefetch }) {
    const { canvasRef, isEmpty } = useRainImpactChart({ data })

    return (
        <ChartFrame
            title={WEATHER_TEXT.rainImpact.title}
            note={WEATHER_TEXT.rainImpact.note}
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={isEmpty ? WEATHER_TEXT.rainImpact.emptyMessage : null}
            frameClassName="weather-deepdive-frame"
            titleClassName="weather-deepdive-frame__title"
            plotClassName="weather-deepdive-plot"
        >
            <canvas ref={canvasRef} />
        </ChartFrame>
    )
}
