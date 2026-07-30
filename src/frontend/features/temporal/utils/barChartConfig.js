import { formatTooltipLabel, formatYAxisTick } from './barChart.ts'
import {
    INK,
    INK_MUTED,
    RULE,
    FONT_SANS,
    FONT_MONO,
} from '@/utils/editorialTokens.js'
import { BAR_SOLID, LINE_PINNED } from '@/utils/styling'
import { toRgba } from '@/utils/color.js'
import { buildDatasetColors } from './chartColors.js'

/**
 * Builds the bar (and optional overlay line) datasets for the temporal bar
 * chart, in single or compare mode.
 * @param {Array} data - Single-series values (ignored in compare mode).
 * @param {Array} labels - Category labels.
 * @param {Array|null} compareDatasets - Optional [{ label, data, color }] compare datasets.
 * @param {Array|null} overlayDatasets - Optional [{ label, data, color }] pinned-slice lines drawn over the bars.
 * @param {string|null} highlight - Label of the hovered bar (solid color).
 * @param {string|null} selectedLabel - Label of the pinned bar (amber selection color).
 * @returns {Array<Object>} Chart.js dataset configs.
 */
export function buildTemporalBarDatasets({ data, labels, compareDatasets, overlayDatasets, highlight, selectedLabel }) {
    const hasCompareDatasets = Array.isArray(compareDatasets) && compareDatasets.length > 0
    const compareList = hasCompareDatasets ? compareDatasets : null

    const barDatasets = hasCompareDatasets
        ? compareDatasets.map((dataset, index) => ({
            label: dataset.label,
            data: dataset.data,
            backgroundColor: buildDatasetColors(labels, highlight, compareList, index, selectedLabel),
            borderColor: toRgba(dataset.color ?? BAR_SOLID, 0.95),
            borderWidth: 1,
            borderRadius: 0,
            borderSkipped: false,
            barPercentage: 0.86,
            categoryPercentage: 0.7,
            order: index,
        }))
        : [{
            data,
            backgroundColor: buildDatasetColors(labels, highlight, null, 0, selectedLabel),
            borderRadius: 0,
            borderSkipped: false,
        }]

    const overlayList = Array.isArray(overlayDatasets) ? overlayDatasets : []
    // The pinned slice from the other chart, one line per layer over the bars
    const overlayLines = overlayList.map((overlay) => {
        const color = overlayList.length > 1 ? (overlay.color ?? LINE_PINNED) : LINE_PINNED

        return {
            type: 'line',
            label: overlay.label,
            data: overlay.data,
            borderColor: color,
            backgroundColor: color,
            pointRadius: 2.5,
            borderWidth: 2,
            tension: 0.25,
            order: -1,
        }
    })

    return [...overlayLines, ...barDatasets]
}

/**
 * Applies highlight/selection color changes to a live temporal bar chart in
 * place, skipping the overlay line dataset.
 * @param {Object} chart - The live Chart.js instance.
 * @param {Object} state - Current { labels, compareDatasets, highlight, selectedLabel }.
 * @returns {void}
 */
export function applyTemporalBarPaint(chart, { labels, compareDatasets, highlight, selectedLabel }) {
    const hasCompareDatasets = Array.isArray(compareDatasets) && compareDatasets.length > 0
    const compareList = hasCompareDatasets ? compareDatasets : null
    let barIndex = 0
    chart.data.datasets.forEach((dataset) => {
        if (dataset.type === 'line') return
        dataset.backgroundColor = buildDatasetColors(labels, highlight, compareList, barIndex, selectedLabel)
        barIndex += 1
    })
}

/**
 * Builds the full Chart.js config for the temporal bar chart. Highlight,
 * selection, the click callback, and the tooltip formatter are read through
 * the `live` ref at call time so hover/pin changes never recreate the chart.
 * @param {Array} data - Single-series values (ignored in compare mode).
 * @param {Array} labels - Category labels.
 * @param {Array|null} compareDatasets - Optional [{ label, data, color }] compare datasets.
 * @param {Array|null} overlayDatasets - Optional [{ label, data, color }] pinned-slice lines drawn over the bars.
 * @param {string} xAxisTitle - Title of the x axis.
 * @param {string} yAxisTitle - Title of the y axis.
 * @param {string} unit - Unit appended to y-axis ticks.
 * @param {number} xLabelStep - Show every Nth category tick.
 * @param {boolean} hasBarClick - Whether bars are clickable (enables pointer cursor).
 * @param {string} [valueNoun='Rides'] - Tooltip name for the value (e.g. "Rides", "Duration").
 * @param {Object} live - Ref holding { highlight, selectedLabel, onBarClick, format }.
 * @returns {Object} The Chart.js config.
 */
export function buildTemporalBarChartConfig({
    data,
    labels,
    compareDatasets,
    overlayDatasets,
    xAxisTitle,
    yAxisTitle,
    unit,
    xLabelStep,
    hasBarClick,
    valueNoun = 'Rides',
    live,
}) {
    const hasCompareDatasets = Array.isArray(compareDatasets) && compareDatasets.length > 0
    const isHourChart = xAxisTitle === 'Hour of Day'
    const tooltipLabelCallback = (tooltipCtx) => {
        const valueLabel = formatTooltipLabel(live.current.format, tooltipCtx)
        const datasetLabel = tooltipCtx.dataset.label
        if (!datasetLabel) return `${valueNoun}: ${valueLabel.trim()}`
        return `${datasetLabel} · ${valueNoun}: ${valueLabel.trim()}`
    }
    const tooltipTitleCallback = (items) => {
        if (!items?.length) return ''
        const hourLabel = String(items?.[0]?.label ?? '')
        if (!isHourChart) return `Moment: ${hourLabel}`
        return `Moment: Hour ${hourLabel.padStart(2, '0')}`
    }
    const yAxisTickCallback = formatYAxisTick.bind(null, unit)

    return {
        type: 'bar',
        data: {
            labels,
            datasets: buildTemporalBarDatasets({
                data,
                labels,
                compareDatasets,
                overlayDatasets,
                highlight: live.current.highlight,
                selectedLabel: live.current.selectedLabel,
            }),
        },
        options: {
            animation: {
                duration: 440,
                easing: 'easeOutQuart',
            },
            responsive: true,
            maintainAspectRatio: false,
            onClick: hasBarClick
                ? (event, _elements, chart) => {
                    const hits = chart.getElementsAtEventForMode(event, 'index', { intersect: true }, false)
                    if (!hits.length) return
                    const index = hits[0].index
                    live.current.onBarClick?.(index, labels[index])
                }
                : undefined,
            onHover: hasBarClick
                ? (event, _elements, chart) => {
                    const hits = chart.getElementsAtEventForMode(event, 'index', { intersect: true }, false)
                    chart.canvas.style.cursor = hits.length ? 'pointer' : 'default'
                }
                : undefined,
            plugins: {
                legend: {
                    display: hasCompareDatasets,
                    position: 'top',
                    labels: {
                        boxWidth: 10,
                        boxHeight: 10,
                        useBorderRadius: false,
                        font: { family: FONT_MONO, size: 10 },
                        color: INK_MUTED,
                        // The single-mode bar dataset has no label, and the pinned-slice
                        // lines are named by the card title; keep both out of the legend
                        filter: (item, chartData) =>
                            Boolean(item.text) && chartData.datasets[item.datasetIndex]?.type !== 'line',
                    },
                },
                tooltip: {
                    padding: { top: 12, right: 14, bottom: 12, left: 14 },
                    displayColors: hasCompareDatasets,
                    usePointStyle: true,
                    borderRadius: 0,
                    titleSpacing: 4,
                    bodySpacing: 5,
                    callbacks: {
                        title: tooltipTitleCallback,
                        label: tooltipLabelCallback,
                    },
                },
            },
            scales: {
                x: {
                    title: {
                        display: Boolean(xAxisTitle),
                        text: xAxisTitle,
                        font: { family: FONT_SANS, size: 13, weight: '500' },
                        color: INK,
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: false,
                        callback: (value, index) => (index % xLabelStep === 0 ? labels[index] : ''),
                        font: { family: FONT_MONO, size: 10 },
                        color: INK_MUTED,
                    },
                    grid: { display: false },
                    border: { display: false },
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: Boolean(yAxisTitle),
                        text: yAxisTitle,
                        font: { family: FONT_SANS, size: 13, weight: '500' },
                        color: INK,
                    },
                    ticks: {
                        maxTicksLimit: 5,
                        callback: yAxisTickCallback,
                        font: { family: FONT_MONO, size: 10 },
                        color: INK_MUTED,
                    },
                    grid: { color: RULE },
                    border: { display: false },
                },
            },
        },
    }
}
