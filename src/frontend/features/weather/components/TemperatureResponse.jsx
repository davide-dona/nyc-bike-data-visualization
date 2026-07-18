import ChartFrame from '@/components/ChartFrame.jsx'
import useTemperatureResponseChart from '../hooks/useTemperatureResponseChart.js'
import { WEATHER_TEXT } from '../utils/weatherText.js'

/**
 * Line chart of average rides per hour across temperature bins, one curve per
 * user type to contrast member and casual weather sensitivity.
 * @param {Array} series - One entry per user type: { userType, bins }
 * @param {boolean} loading - Whether data is loading
 * @param {Error|null} error - Fetch error
 * @param {Function} onRefetch - Callback to trigger a retry after error
 */
export default function TemperatureResponse({ series, loading, error, onRefetch }) {
    const { canvasRef, hasData } = useTemperatureResponseChart({ series })

    return (
        <ChartFrame
            title={WEATHER_TEXT.temperatureResponse.title}
            note={WEATHER_TEXT.temperatureResponse.note}
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={!hasData ? WEATHER_TEXT.temperatureResponse.emptyMessage : null}
            frameClassName="weather-deepdive-frame"
            titleClassName="weather-deepdive-frame__title"
            plotClassName="weather-deepdive-plot"
        >
            <canvas ref={canvasRef} />
        </ChartFrame>
    )
}
