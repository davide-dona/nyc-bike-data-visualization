import { GROUPED_WEATHER_CODES } from './wmoCodeHandler.js'
import {
    INK,
    INK_MUTED,
    RULE,
    FONT_SANS,
    FONT_MONO,
} from '@/utils/editorialTokens.js'
import { SCATTER_BORDER_COLOR, SCATTER_BORDER_WIDTH, SCATTER_POINT_RADIUS } from '@/utils/styling'

/**
 * Builds the Chart.js config for the weather scatter plot (rides per hour vs
 * average speed, one dataset per weather observation, colored by group).
 * @param {Array} formattedData - Points shaped by formatData (utils/scatterPlot.js).
 * @param {Function} externalTooltipHandler - Chart.js external tooltip handler driving the shared FloatingTooltip.
 * @returns {Object} The Chart.js config.
 */
export function buildScatterPlotConfig({ formattedData, externalTooltipHandler }) {
    return {
        type: 'scatter',
        data: {
            datasets: formattedData.map(point => ({
                label: point.weatherGroup,
                // y = rides per hour, x = average speed, color = weather group
                data: [{ x: point.avgSpeed, y: point.ridesPerHour, ...point }],
                backgroundColor: GROUPED_WEATHER_CODES[point.weatherGroup]?.[1] ?? INK_MUTED,
                borderColor: SCATTER_BORDER_COLOR,
                borderWidth: SCATTER_BORDER_WIDTH,
                pointRadius: SCATTER_POINT_RADIUS,
                pointHoverRadius: SCATTER_POINT_RADIUS * 1.5,
                pointStyle: 'circle',
            })),
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 420,
                easing: 'easeOutQuart',
            },
            animations: {
                radius: {
                    duration: 520,
                    easing: 'easeOutQuart',
                },
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: FONT_MONO, size: 10 },
                        color: INK_MUTED,
                        boxWidth: 12,
                        boxHeight: 12,
                        padding: 20,
                        // Each point is its own dataset; show one legend entry per weather group (first dataset).
                        filter: (item, chartData) =>
                            chartData.datasets.findIndex(ds => ds.label === item.text) === item.datasetIndex,
                    },
                    // Toggling a group shows/hides all datasets sharing its label (not dataset order).
                    onClick: (e, item, legend) => {
                        const chart = legend.chart
                        const targetLabel = item.text
                        const nextHidden = chart.isDatasetVisible(item.datasetIndex)
                        chart.data.datasets.forEach((ds, i) => {
                            if (ds.label === targetLabel) {
                                chart.setDatasetVisibility(i, !nextHidden)
                            }
                        })
                        chart.update()
                    },
                },
                tooltip: {
                    padding: 12,
                    caretPadding: 16,
                    enabled: false,
                    external: externalTooltipHandler,
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Average Speed (km/h)',
                        font: { family: FONT_SANS, size: 13, weight: '500' },
                        color: INK,
                    },
                    ticks: { font: { family: FONT_MONO, size: 10 }, color: INK_MUTED },
                    grid: { color: RULE },
                },
                y: {
                    title: {
                        display: true,
                        text: 'Rides Per Hour',
                        font: { family: FONT_SANS, size: 13, weight: '500' },
                        color: INK,
                    },
                    beginAtZero: true,
                    ticks: {
                        font: { family: FONT_MONO, size: 10 },
                        color: INK_MUTED,
                        callback: value => Number(value).toFixed(0),
                    },
                    grid: { color: RULE },
                },
            },
        },
    }
}
