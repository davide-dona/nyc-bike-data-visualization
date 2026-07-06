import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js/auto'
import {
    INK,
    INK_MUTED,
    RULE,
    FONT_DISPLAY,
    FONT_MONO,
} from '../../../utils/editorialTokens.js'
import { BAR_SOLID, BAR_PINNED } from '../../../utils/styling'
import { formatCompact } from '../../../utils/numberFormat.js'

// Unit-separator control char: cannot appear in station names or year labels,
// so joined keys round-trip safely even when labels contain spaces.
const KEY_SEPARATOR = '\u001f'
// Record-separator control char: joins the lines of a multi-line label inside
// a key entry, so array labels round-trip through labelsKey alongside plain
// string labels.
const LINE_SEPARATOR = '\u001e'

// Long station/corridor names would eat the plot area on horizontal charts;
// ticks are truncated in the middle (corridor labels differ at both ends),
// tooltips keep the full label.
const MAX_CATEGORY_TICK_CHARS = 26

const truncateLabel = (label) => {
    const text = String(label)
    if (text.length <= MAX_CATEGORY_TICK_CHARS) return text
    const half = Math.floor((MAX_CATEGORY_TICK_CHARS - 1) / 2)
    return `${text.slice(0, half)}…${text.slice(text.length - half)}`
}

// Multi-line labels arrive as arrays; each line is truncated on its own so a
// two-line corridor label keeps both station names readable.
const truncateTickLabel = (label) =>
    Array.isArray(label) ? label.map(truncateLabel) : truncateLabel(label)

const labelToKey = (label) =>
    Array.isArray(label) ? label.join(LINE_SEPARATOR) : String(label)

const keyToLabel = (key) =>
    key.includes(LINE_SEPARATOR) ? key.split(LINE_SEPARATOR) : key

function buildBarColors(labels, highlightLabel, colors) {
    return labels.map((label, index) => {
        if (highlightLabel != null && label === highlightLabel) return BAR_PINNED
        return colors?.[index] ?? BAR_SOLID
    })
}

function buildDatasets(labels, values, groups, highlightLabel, colors) {
    if (Array.isArray(groups) && groups.length > 0) {
        return groups.map((group) => ({
            label: group.label,
            data: group.values,
            backgroundColor: group.color,
            borderRadius: 0,
            borderSkipped: false,
            barPercentage: 0.86,
            categoryPercentage: 0.7,
        }))
    }
    return [{
        data: values,
        backgroundColor: buildBarColors(labels, highlightLabel, colors),
        borderRadius: 0,
        borderSkipped: false,
    }]
}

/**
 * Bar chart for the map insights panel, following the editorial Chart.js
 * conventions of the temporal and footprint charts. The chart is recreated
 * only when its label structure changes; value, color, and highlight changes
 * are applied in place with chart.update('none') so scrubbing the year slider
 * or the time wheel never stutters.
 * @param {Array} labels - Category labels; an array entry renders as a multi-line tick.
 * @param {Array} values - Single-series values (ignored when groups is set).
 * @param {Array} groups - Optional [{ label, values, color }] for grouped bars; renders a legend.
 * @param {boolean} horizontal - Draw bars horizontally (category axis on y).
 * @param {boolean} diverging - Butterfly layout: two groups share each row and grow in
 *   opposite directions from zero (one group carries negative values); ticks and
 *   tooltips show absolute values.
 * @param {Array} colors - Optional per-bar colors for the single-series mode.
 * @param {string} highlightLabel - Label of the bar painted in the amber selection color.
 * @param {Function} onBarClick - Optional (index, label) callback; enables the pointer cursor.
 * @param {string} xAxisTitle - Title of the x axis.
 * @param {string} yAxisTitle - Title of the y axis.
 * @param {Function} formatValue - Formats value-axis ticks and tooltip values.
 * @param {number} xLabelStep - Show every Nth category tick on vertical charts.
 */
export default function InsightBarChart({
    labels = [],
    values = [],
    groups = null,
    horizontal = false,
    diverging = false,
    colors = null,
    highlightLabel = null,
    onBarClick = null,
    xAxisTitle,
    yAxisTitle,
    formatValue = formatCompact,
    xLabelStep = 1,
}) {
    const canvasRef = useRef(null)
    const chartRef = useRef(null)
    // Values, colors, and highlight are applied in place (see the effect
    // below); the chart-creation effect reads them through refs so it does
    // not recreate the chart when they change.
    const valuesRef = useRef(values)
    valuesRef.current = values
    const groupsRef = useRef(groups)
    groupsRef.current = groups
    const colorsRef = useRef(colors)
    colorsRef.current = colors
    const highlightRef = useRef(highlightLabel)
    highlightRef.current = highlightLabel
    const onBarClickRef = useRef(onBarClick)
    onBarClickRef.current = onBarClick
    const formatValueRef = useRef(formatValue)
    formatValueRef.current = formatValue
    const hasBarClick = Boolean(onBarClick)
    const hasGroups = Array.isArray(groups) && groups.length > 0
    // Tracks what the chart currently displays so the in-place effect can
    // skip the redundant pass right after (re)creation, preserving the
    // creation animation.
    const paintedKeyRef = useRef('')

    const labelsKey = labels.map(labelToKey).join(KEY_SEPARATOR)
    const groupStructureKey = hasGroups
        ? groups.map((group) => `${group.label}|${group.color}`).join(KEY_SEPARATOR)
        : ''
    const paintKey = [
        hasGroups ? groups.map((group) => group.values.join(',')).join(';') : values.join(','),
        colors?.join(',') ?? '',
        highlightLabel ?? '',
    ].join('|')

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) return undefined

        const categoryLabels = labelsKey === '' ? [] : labelsKey.split(KEY_SEPARATOR).map(keyToLabel)
        const categoryAxis = {
            title: {
                display: Boolean(horizontal ? yAxisTitle : xAxisTitle),
                text: horizontal ? yAxisTitle : xAxisTitle,
                font: { family: FONT_DISPLAY, size: 13, weight: '500' },
                color: INK,
            },
            ticks: {
                maxRotation: 0,
                autoSkip: false,
                callback: horizontal
                    ? function categoryTick(value) { return truncateTickLabel(this.getLabelForValue(value)) }
                    : (value, index) => (index % xLabelStep === 0 ? categoryLabels[index] : ''),
                font: { family: FONT_MONO, size: 10 },
                color: INK_MUTED,
            },
            grid: { display: false },
            border: { display: false },
        }
        const valueAxis = {
            beginAtZero: true,
            title: {
                display: Boolean(horizontal ? xAxisTitle : yAxisTitle),
                text: horizontal ? xAxisTitle : yAxisTitle,
                font: { family: FONT_DISPLAY, size: 13, weight: '500' },
                color: INK,
            },
            ticks: {
                maxTicksLimit: 5,
                // Diverging rows encode direction by side, so both sides of
                // the zero line read as magnitudes.
                callback: (value) => formatValueRef.current(diverging ? Math.abs(value) : value),
                font: { family: FONT_MONO, size: 10 },
                color: INK_MUTED,
            },
            grid: { color: RULE },
            border: { display: false },
        }
        if (diverging) {
            categoryAxis.stacked = true
            valueAxis.stacked = true
        }

        paintedKeyRef.current = [
            hasGroups
                ? groupsRef.current.map((group) => group.values.join(',')).join(';')
                : valuesRef.current.join(','),
            colorsRef.current?.join(',') ?? '',
            highlightRef.current ?? '',
        ].join('|')
        chartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categoryLabels,
                datasets: buildDatasets(
                    categoryLabels,
                    valuesRef.current,
                    groupsRef.current,
                    highlightRef.current,
                    colorsRef.current,
                ),
            },
            options: {
                indexAxis: horizontal ? 'y' : 'x',
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
                        onBarClickRef.current?.(index, categoryLabels[index])
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
                        display: hasGroups,
                        position: 'top',
                        labels: {
                            boxWidth: 10,
                            boxHeight: 10,
                            useBorderRadius: false,
                            font: { family: FONT_MONO, size: 10 },
                            color: INK_MUTED,
                            filter: (item) => Boolean(item.text),
                        },
                    },
                    tooltip: {
                        padding: { top: 12, right: 14, bottom: 12, left: 14 },
                        displayColors: hasGroups,
                        usePointStyle: true,
                        borderRadius: 0,
                        titleSpacing: 4,
                        bodySpacing: 5,
                        callbacks: {
                            // Multi-line category labels arrive as arrays;
                            // the tooltip title reads them as one line.
                            title: (items) => {
                                const item = items[0]
                                if (!item) return ''
                                const label = item.chart.data.labels[item.dataIndex]
                                return Array.isArray(label) ? label.join(' ') : String(label ?? '')
                            },
                            label: (tooltipCtx) => {
                                const parsedValue = horizontal ? tooltipCtx.parsed.x : tooltipCtx.parsed.y
                                const rawValue = diverging ? Math.abs(parsedValue) : parsedValue
                                const valueLabel = formatValueRef.current(rawValue)
                                const datasetLabel = tooltipCtx.dataset.label
                                return datasetLabel ? `${datasetLabel}: ${valueLabel}` : ` ${valueLabel}`
                            },
                        },
                    },
                },
                scales: horizontal
                    ? { x: valueAxis, y: categoryAxis }
                    : { x: categoryAxis, y: valueAxis },
            },
        })

        return () => chartRef.current?.destroy()
        // Value/color/highlight changes are handled in place below; only
        // structural changes recreate the chart.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [labelsKey, groupStructureKey, hasGroups, horizontal, diverging, xAxisTitle, yAxisTitle, xLabelStep, hasBarClick])

    // Apply value/color/highlight changes in place instead of recreating the
    // chart, so year-slider and time-wheel scrubbing repaint without churn.
    useEffect(() => {
        const chart = chartRef.current
        if (!chart || paintedKeyRef.current === paintKey) return

        if (hasGroups) {
            chart.data.datasets.forEach((dataset, index) => {
                dataset.data = groups[index]?.values ?? []
            })
        } else {
            chart.data.datasets[0].data = values
            chart.data.datasets[0].backgroundColor = buildBarColors(chart.data.labels, highlightLabel, colors)
        }
        paintedKeyRef.current = paintKey
        chart.update('none')
    }, [paintKey, hasGroups, groups, values, colors, highlightLabel])

    return <canvas ref={canvasRef} />
}
