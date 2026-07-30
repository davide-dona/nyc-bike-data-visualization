import { formatCount, formatNumber } from '@/utils/numberFormat.js'
import { RIDE_METRIC_LABELS } from '@/utils/rideMetricLabels.js'
import { WEATHER_TEXT } from '../utils/weatherText.js'

const WEATHER_ICONS = {
    Clear: '☀',
    Cloudy: '☁',
    Foggy: '🌫',
    Drizzle: '🌦',
    Rain: '🌧',
    Snow: '❄',
    Showers: '🌦',
    Thunderstorm: '⛈',
}

/**
 * Weather scatter-plot tooltip content: hovered condition's activity and journey stats, rendered in the shared FloatingTooltip.
 */
export default function WeatherTooltipContent({ point }) {
    return (
        <div className="weather-tooltip">
            <div className="weather-tooltip__header">
                <div className="weather-tooltip__title">
                    <span aria-hidden="true">{WEATHER_ICONS[point.weatherGroup] ?? '•'}</span>
                    <span>{point.weatherLabel ?? point.weatherGroup}</span>
                </div>
                <div className="weather-tooltip__subtitle">{point.weatherGroup}</div>
            </div>
            <div className="weather-tooltip__section weather-tooltip__section--tinted">
                <div className="weather-tooltip__section-title">{WEATHER_TEXT.tooltip.activity}</div>
                <div className="weather-tooltip__row">
                    <span className="weather-tooltip__muted">{RIDE_METRIC_LABELS.perHour.label}:</span>
                    <strong>{formatNumber(point.ridesPerHour, 2)}</strong>
                    {point.ridesPerHourSE != null && (
                        <span className="weather-tooltip__se">± {formatNumber(point.ridesPerHourSE, 2)}</span>
                    )}
                </div>
                <div className="weather-tooltip__row">
                    <span className="weather-tooltip__muted">{RIDE_METRIC_LABELS.total.label}:</span>
                    <strong>{formatCount(point.totalRides)}</strong>
                </div>
                <div className="weather-tooltip__row">
                    <span className="weather-tooltip__muted">{WEATHER_TEXT.tooltip.observedHours}</span>
                    <strong>{formatCount(point.hoursCount)}</strong>
                </div>
            </div>
            <div className="weather-tooltip__section">
                <div className="weather-tooltip__section-title">{WEATHER_TEXT.tooltip.journeyFeel}</div>
                <div className="weather-tooltip__row">
                    <span className="weather-tooltip__muted">{WEATHER_TEXT.tooltip.typicalDuration}</span>
                    <strong>{formatNumber(point.avgDurationMin, 2)}m</strong>
                </div>
                <div className="weather-tooltip__row">
                    <span className="weather-tooltip__muted">{WEATHER_TEXT.tooltip.typicalDistance}</span>
                    <strong>{formatNumber(point.avgDistanceKm, 2)}km</strong>
                </div>
                <div className="weather-tooltip__row">
                    <span className="weather-tooltip__muted">{WEATHER_TEXT.tooltip.typicalSpeed}</span>
                    <strong>{formatNumber(point.avgSpeed, 2)}km/h</strong>
                    {point.avgSpeedSE != null && (
                        <span className="weather-tooltip__se">± {formatNumber(point.avgSpeedSE, 2)}</span>
                    )}
                </div>
            </div>
        </div>
    )
}
