import useWeatherStats from "./hooks/useWeatherStats"
import useWeatherRidgelineStats from "./hooks/useWeatherRidgelineStats"
import useTemperatureResponse from "./hooks/useTemperatureResponse"
import useRainImpact from "./hooks/useRainImpact"
import ScatterPlot from "./components/ScatterPlot"
import WeatherRidgeline from "./components/WeatherRidgeline"
import TemperatureResponse from "./components/TemperatureResponse"
import RainImpact from "./components/RainImpact"
import VisualizationGuide from "../../components/VisualizationGuide"
import { WEATHER_GUIDE } from "./utils/weatherGuide.js"
import { WEATHER_TEXT } from './utils/weatherText.js'

/**
 *  Component for the weather impact on ride behaviour page
 * @param {Object} filters - The filters to apply to the data, such as date range or user-selected filters.
 */
function WeatherPage({ filters = {} }) {
    const { weatherStats, loading, error, refetch } = useWeatherStats(filters)
    const {
        ridgelineStats,
        loading: ridgelineLoading,
        error: ridgelineError,
        refetch: refetchRidgeline,
    } = useWeatherRidgelineStats(filters)
    const {
        series: temperatureSeries,
        loading: temperatureLoading,
        error: temperatureError,
        refetch: refetchTemperature,
    } = useTemperatureResponse(filters)
    const {
        rainStats,
        loading: rainLoading,
        error: rainError,
        refetch: refetchRain,
    } = useRainImpact(filters)


    return (
        <section className="page-card">
            <header className="page-card__header">
                <div className="page-card__heading">
                    <span className="page-card__eyebrow">{WEATHER_TEXT.page.eyebrow}</span>
                    <h2 className="page-card__title">{WEATHER_TEXT.page.title}</h2>
                    <p className="page-card__subtitle">{WEATHER_TEXT.page.subtitle}</p>
                </div>
            </header>
            <div className="page-card__body">
                <ScatterPlot
                    data={weatherStats}
                    loading={loading}
                    error={error}
                    onRefetch={refetch}
                />

                <WeatherRidgeline
                    data={ridgelineStats}
                    loading={ridgelineLoading}
                    error={ridgelineError}
                    onRefetch={refetchRidgeline}
                />

                <div className="weather-deepdive-grid">
                    <TemperatureResponse
                        series={temperatureSeries}
                        loading={temperatureLoading}
                        error={temperatureError}
                        onRefetch={refetchTemperature}
                    />
                    <RainImpact
                        data={rainStats}
                        loading={rainLoading}
                        error={rainError}
                        onRefetch={refetchRain}
                    />
                </div>

                <VisualizationGuide {...WEATHER_GUIDE} />
            </div>
        </section>
    )
}

export default WeatherPage
