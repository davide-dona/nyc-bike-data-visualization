import useWeatherStats from "./hooks/useWeatherStats"
import useWeatherRidgelineStats from "./hooks/useWeatherRidgelineStats"
import useTemperatureResponse from "./hooks/useTemperatureResponse"
import useRainImpact from "./hooks/useRainImpact"
import ScatterPlot from "./components/ScatterPlot"
import WeatherRidgeline from "./components/WeatherRidgeline"
import TemperatureResponse from "./components/TemperatureResponse"
import RainImpact from "./components/RainImpact"
import VisualizationGuide from "../../components/VisualizationGuide"

/**
 *  Component for the weather impact on ride behaviour page
 * @param {Object} filters - The filters to apply to the data, such as date range or user-selected filters.
 */
function WeatherPage({ filters = {} }) {
    // Fetch weather statistics using the custom hook
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
                    <span className="page-card__eyebrow">03 - Climate</span>
                    <h2 className="page-card__title">When the sky decides.</h2>
                    <p className="page-card__subtitle">
                        How average speed and trip frequency respond to the weather
                        over New York.
                    </p>
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

                <VisualizationGuide
                    mapName="Weather Impact"
                    title="How To Read It"
                    summary="Each point links weather conditions to mobility behavior. Use the chart to identify thresholds where weather starts changing trip speed or volume in a meaningful way."
                    hints={[
                        {
                            title: 'Look for clusters',
                            text: 'Tight clouds suggest stable behavior under similar weather, while spread-out clouds indicate more uncertainty in rider response.',
                        },
                        {
                            title: 'Watch for breakpoints',
                            text: 'Find where trends bend: a small weather change can trigger a strong drop or rise after a critical point.',
                        },
                        {
                            title: 'Compare with other views',
                            text: 'Use the ridgeline to inspect when each weather code concentrates over hours and weekdays, then connect that pattern to temporal peaks.',
                        },
                        {
                            title: 'Read the curves',
                            text: 'The temperature curve shows how demand climbs with warmth - casual riders react more strongly than members. The rain bars show how much ridership survives each precipitation intensity relative to dry hours.',
                        },
                    ]}
                />
            </div>
        </section>
    )
}

export default WeatherPage
