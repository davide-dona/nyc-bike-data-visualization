import Plot from 'react-plotly.js'
import StatusMessage from '@/components/StatusMessage'
import useWeatherRidgeline from '../hooks/useWeatherRidgeline.js'
import { WEATHER_TEXT } from '../utils/weatherText.js'

/**
 * Ridgeline plot of rides-per-hour distributions by WMO weather code, toggleable between hour-of-day and day-of-week.
 */
function WeatherRidgeline({ data, loading, error, onRefetch }) {
    const { dimension, setDimension, traces, plotLayout, hasData, noteText } = useWeatherRidgeline({ data })
    const showOverlay = loading || error

    return (
        <div className={`weather-ridgeline-frame${showOverlay ? ' weather-ridgeline-frame--hidden' : ''}`}>
            <div className="weather-ridgeline-toolbar">
                <p className="weather-ridgeline-toolbar__title">{WEATHER_TEXT.ridgeline.title}</p>
                <div className="weather-ridgeline-toggle" role="tablist" aria-label="Ridgeline dimension">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={dimension === 'hour'}
                        className={`weather-ridgeline-toggle__btn${dimension === 'hour' ? ' is-active' : ''}`}
                        onClick={() => setDimension('hour')}
                    >
                        {WEATHER_TEXT.ridgeline.dimensionByHour}
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={dimension === 'day_of_week'}
                        className={`weather-ridgeline-toggle__btn${dimension === 'day_of_week' ? ' is-active' : ''}`}
                        onClick={() => setDimension('day_of_week')}
                    >
                        {WEATHER_TEXT.ridgeline.dimensionByWeekday}
                    </button>
                </div>
            </div>

            <div className="weather-ridgeline-plot">
                {hasData ? (
                    <Plot
                        data={traces}
                        layout={plotLayout}
                        config={{ displayModeBar: false, scrollZoom: false }}
                        useResizeHandler
                        className="w-full h-full"
                    />
                ) : (
                    <div className="weather-ridgeline-empty">
                        {WEATHER_TEXT.ridgeline.emptyMessage}
                    </div>
                )}
            </div>

            <p className="chart-frame__note weather-ridgeline-note">{noteText}</p>

            {showOverlay && <StatusMessage loading={loading} error={error} onRefetch={onRefetch} />}
        </div>
    )
}

export default WeatherRidgeline
