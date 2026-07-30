import { BAR_SOLID, BAR_PINNED } from '@/utils/styling'
import {
    INK,
    INK_MUTED,
    RULE,
    FONT_SANS,
    FONT_MONO,
} from '@/utils/editorialTokens.js'

// Unit-separator control char: cannot appear in station names or year labels, so joined keys round-trip safely.
export const KEY_SEPARATOR = '\u001f'
// Record-separator control char: joins the lines of a multi-line label so array labels round-trip through labelsKey.
export const LINE_SEPARATOR = '\u001e'

// Long names would eat the horizontal plot area, so ticks are middle-truncated (corridors differ at both ends); tooltips keep the full label.
export const MAX_CATEGORY_TICK_CHARS = 26

/**
 * Truncates one label line in the middle to MAX_CATEGORY_TICK_CHARS.
 * @param {string} label - The label line.
 * @returns {string} The label, middle-elided when too long.
 */
const truncateLabel = (label) => {
    const text = String(label)
    if (text.length <= MAX_CATEGORY_TICK_CHARS) return text
    const half = Math.floor((MAX_CATEGORY_TICK_CHARS - 1) / 2)
    return `${text.slice(0, half)}…${text.slice(text.length - half)}`
}

/**
 * Truncates a tick label; multi-line labels arrive as arrays and each line
 * is truncated on its own so a two-line corridor label keeps both station
 * names readable.
 * @param {string|string[]} label - The tick label.
 * @returns {string|string[]} The truncated label, same shape as the input.
 */
export const truncateTickLabel = (label) =>
    Array.isArray(label) ? label.map(truncateLabel) : truncateLabel(label)

/**
 * Encodes a (possibly multi-line) label as a single string key.
 * @param {string|string[]} label - The label.
 * @returns {string} A key that round-trips through keyToLabel.
 */
export const labelToKey = (label) =>
    Array.isArray(label) ? label.join(LINE_SEPARATOR) : String(label)

/**
 * Decodes a label key back into its string or multi-line array form.
 * @param {string} key - Key produced by labelToKey.
 * @returns {string|string[]} The original label shape.
 */
export const keyToLabel = (key) =>
    key.includes(LINE_SEPARATOR) ? key.split(LINE_SEPARATOR) : key

/**
 * Builds per-bar colors for the single-series mode: the highlighted label
 * gets the amber selection color, everything else its own or the solid color.
 * @param {Array} labels - Category labels.
 * @param {string|null} highlightLabel - Label to paint in the selection color.
 * @param {Array|null} colors - Optional per-bar base colors.
 * @returns {Array<string>} One color per bar.
 */
export function buildBarColors(labels, highlightLabel, colors) {
    return labels.map((label, index) => {
        if (highlightLabel != null && label === highlightLabel) return BAR_PINNED
        return colors?.[index] ?? BAR_SOLID
    })
}

/**
 * Builds a group dataset's background color: a flat group color normally, or
 * per-bar colors with the highlighted label in the amber selection color.
 * @param {Array} labels - Category labels.
 * @param {Object} group - The { label, values, color } group.
 * @param {string|null} highlightLabel - Label painted in the selection color.
 * @returns {string|Array<string>} Color or per-bar colors for the dataset.
 */
function buildGroupColors(labels, group, highlightLabel) {
    if (highlightLabel == null) return group.color
    return labels.map((label) => (label === highlightLabel ? BAR_PINNED : group.color))
}

/**
 * Builds the Chart.js datasets: one dataset per group when groups are given
 * (grouped/diverging mode), otherwise a single highlighted series.
 * @param {Array} labels - Category labels.
 * @param {Array} values - Single-series values (ignored when groups is set).
 * @param {Array|null} groups - Optional [{ label, values, color }] groups.
 * @param {string|null} highlightLabel - Label painted in the selection color.
 * @param {Array|null} colors - Optional per-bar colors for the single series.
 * @returns {Array<Object>} Chart.js dataset configs.
 */
export function buildDatasets(labels, values, groups, highlightLabel, colors) {
    if (Array.isArray(groups) && groups.length > 0) {
        return groups.map((group) => ({
            label: group.label,
            data: group.values,
            backgroundColor: buildGroupColors(labels, group, highlightLabel),
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
 * Applies value/color/highlight changes to a live chart in place, so scrub
 * controls repaint without recreating the chart.
 * @param {Object} chart - The live Chart.js instance.
 * @param {Object} live - Current { values, groups, colors, highlightLabel }.
 * @returns {void}
 */
export function applyBarPaint(chart, { values, groups, colors, highlightLabel }) {
    if (Array.isArray(groups) && groups.length > 0) {
        chart.data.datasets.forEach((dataset, index) => {
            const group = groups[index]
            if (!group) return
            dataset.data = group.values ?? []
            dataset.backgroundColor = buildGroupColors(chart.data.labels, group, highlightLabel)
        })
        return
    }
    chart.data.datasets[0].data = values
    chart.data.datasets[0].backgroundColor = buildBarColors(chart.data.labels, highlightLabel, colors)
}

/**
 * Default tooltip title: multi-line category labels arrive as arrays and read
 * as one line.
 * @param {string|string[]} label - The category label.
 * @returns {string} The single-line title.
 */
const defaultTooltipTitle = (label) =>
    Array.isArray(label) ? label.join(' ') : String(label ?? '')

/**
 * Builds the full Chart.js config for the insights bar chart. Values, colors,
 * highlight, and the tooltip/click callbacks are read through the `live` ref
 * at call time, so paint-only changes never force a chart recreation.
 * @param {boolean} horizontal - Draw bars horizontally (category axis on y).
 * @param {boolean} diverging - Butterfly layout; ticks and tooltips show absolute values.
 * @param {boolean} hasBarClick - Whether bars are clickable (enables pointer cursor).
 * @param {number} xLabelStep - Show every Nth category tick on vertical charts.
 * @param {Object} live - Ref holding { values, groups, colors, highlightLabel, onBarClick, formatValue, formatTooltipTitle, formatTooltipLabel }.
 * @returns {Object} The Chart.js config.
 */
export function buildInsightBarChartConfig({
    categoryLabels,
    horizontal,
    diverging,
    hasBarClick,
    xAxisTitle,
    yAxisTitle,
    xLabelStep,
    live,
}) {
    const hasGroups = Array.isArray(live.current.groups) && live.current.groups.length > 0
    const categoryAxis = {
        title: {
            display: Boolean(horizontal ? yAxisTitle : xAxisTitle),
            text: horizontal ? yAxisTitle : xAxisTitle,
            font: { family: FONT_SANS, size: 13, weight: '500' },
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
            font: { family: FONT_SANS, size: 13, weight: '500' },
            color: INK,
        },
        ticks: {
            maxTicksLimit: 5,
            // Diverging rows encode direction by side, so both sides read as magnitudes.
            callback: (value) => live.current.formatValue(diverging ? Math.abs(value) : value),
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

    return {
        type: 'bar',
        data: {
            labels: categoryLabels,
            datasets: buildDatasets(
                categoryLabels,
                live.current.values,
                live.current.groups,
                live.current.highlightLabel,
                live.current.colors,
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
                    live.current.onBarClick?.(index, categoryLabels[index])
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
                        title: (items) => {
                            const item = items[0]
                            if (!item) return ''
                            const label = item.chart.data.labels[item.dataIndex]
                            const custom = live.current.formatTooltipTitle
                            return custom ? custom(label) : defaultTooltipTitle(label)
                        },
                        label: (tooltipCtx) => {
                            const parsedValue = horizontal ? tooltipCtx.parsed.x : tooltipCtx.parsed.y
                            const rawValue = diverging ? Math.abs(parsedValue) : parsedValue
                            const custom = live.current.formatTooltipLabel
                            if (custom) {
                                return custom({
                                    value: rawValue,
                                    datasetLabel: tooltipCtx.dataset.label,
                                    label: tooltipCtx.chart.data.labels[tooltipCtx.dataIndex],
                                })
                            }
                            const valueLabel = live.current.formatValue(rawValue)
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
    }
}
