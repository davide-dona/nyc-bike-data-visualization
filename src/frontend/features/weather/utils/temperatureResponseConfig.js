import {
    ACCENT,
    INK,
    INK_MUTED,
    RULE,
    FONT_SANS,
    FONT_MONO,
} from '@/utils/editorialTokens.js'
import { formatNumber } from '@/utils/numberFormat.js'
import { RIDE_METRIC_LABELS } from '@/utils/rideMetricLabels.js'

// Bins with fewer hours are dropped to avoid a wild single-hour outlier point.
const MIN_HOURS = 5
const BIN_WIDTH = 2 // °C, must match _WEATHER_EXPRS in src/backend/services/ride_stats.py

const USER_TYPE_LABELS = { member: 'Member', casual: 'Casual' }
const USER_TYPE_COLORS = { member: ACCENT, casual: '#c24747' }

/**
 * Converts per-user-type temperature-bin stats into sorted rides-per-hour
 * points, dropping bins with too few covered hours to be meaningful.
 * @param {Array} series - [{userType, bins}] from the fetch hook.
 * @returns {Array} [{userType, points: [{x, y}]}] sorted by temperature.
 */
export function formatTemperatureSeries(series) {
    return series.map(({ userType, bins }) => ({
        userType,
        points: bins
            .filter((bin) => bin.weather_bin !== null && bin.hours_count >= MIN_HOURS)
            .map((bin) => ({ x: Number(bin.weather_bin), y: bin.total_rides / bin.hours_count }))
            .sort((a, b) => a.x - b.x),
    }))
}

/**
 * Builds the Chart.js config for the temperature-response line chart: average
 * rides per hour across temperature bins, one curve per user type.
 * @param {Array} formattedSeries - Series shaped by formatTemperatureSeries.
 * @returns {Object} The Chart.js config.
 */
export function buildTemperatureResponseConfig(formattedSeries) {
    return {
        type: 'line',
        data: {
            datasets: formattedSeries.map(({ userType, points }) => ({
                label: USER_TYPE_LABELS[userType] ?? userType,
                data: points,
                borderColor: USER_TYPE_COLORS[userType] ?? ACCENT,
                backgroundColor: USER_TYPE_COLORS[userType] ?? ACCENT,
                borderWidth: 2,
                pointRadius: 2.5,
                tension: 0.25,
            })),
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: FONT_MONO, size: 10 },
                        color: INK_MUTED,
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 16,
                    },
                },
                tooltip: {
                    callbacks: {
                        title: (items) => `${items[0].parsed.x} to ${items[0].parsed.x + BIN_WIDTH}°C`,
                        label: (item) => `${item.dataset.label}: ${formatNumber(item.parsed.y, 2)} ${RIDE_METRIC_LABELS.perHour.unit}`,
                    },
                },
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        font: { family: FONT_SANS, size: 13, weight: '500' },
                        color: INK,
                    },
                    ticks: {
                        font: { family: FONT_MONO, size: 10 },
                        color: INK_MUTED,
                        callback: (value) => `${value}°`,
                    },
                    grid: { color: RULE },
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: RIDE_METRIC_LABELS.perHour.label,
                        font: { family: FONT_SANS, size: 13, weight: '500' },
                        color: INK,
                    },
                    ticks: {
                        font: { family: FONT_MONO, size: 10 },
                        color: INK_MUTED,
                        callback: (value) => Number(value).toFixed(0),
                    },
                    grid: { color: RULE },
                },
            },
        },
    }
}
