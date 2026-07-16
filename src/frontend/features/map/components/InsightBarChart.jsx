import { useRef } from 'react'
import { formatCompact } from '@/utils/numberFormat.js'
import useChartJs from '@/hooks/useChartJs.js'
import {
    KEY_SEPARATOR,
    applyBarPaint,
    buildInsightBarChartConfig,
    keyToLabel,
    labelToKey,
} from '../utils/insightBarChart.js'

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
 * @param {Function} formatTooltipTitle - Optional (label) => string tooltip title override.
 * @param {Function} formatTooltipLabel - Optional ({ value, datasetLabel, label }) => string tooltip body override.
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
    formatTooltipTitle = null,
    formatTooltipLabel = null,
    xLabelStep = 1,
}) {
    // Paint-only props are read through this ref at call time so the chart is
    // not recreated when they change.
    const live = useRef({})
    live.current = {
        values,
        groups,
        colors,
        highlightLabel,
        onBarClick,
        formatValue,
        formatTooltipTitle,
        formatTooltipLabel,
    }

    const hasBarClick = Boolean(onBarClick)
    const hasGroups = Array.isArray(groups) && groups.length > 0
    const labelsKey = labels.map(labelToKey).join(KEY_SEPARATOR)
    const groupStructureKey = hasGroups
        ? groups.map((group) => `${group.label}|${group.color}`).join(KEY_SEPARATOR)
        : ''
    const structuralKey = [
        labelsKey,
        groupStructureKey,
        hasGroups,
        horizontal,
        diverging,
        xAxisTitle ?? '',
        yAxisTitle ?? '',
        xLabelStep,
        hasBarClick,
    ].join(KEY_SEPARATOR)
    const paintKey = [
        hasGroups ? groups.map((group) => group.values.join(',')).join(';') : values.join(','),
        colors?.join(',') ?? '',
        highlightLabel ?? '',
    ].join('|')

    const { canvasRef } = useChartJs({
        buildConfig: () =>
            buildInsightBarChartConfig({
                categoryLabels: labelsKey === '' ? [] : labelsKey.split(KEY_SEPARATOR).map(keyToLabel),
                horizontal,
                diverging,
                hasBarClick,
                xAxisTitle,
                yAxisTitle,
                xLabelStep,
                live,
            }),
        structuralKey,
        paintKey,
        applyPaint: (chart) => applyBarPaint(chart, live.current),
    })

    return <canvas ref={canvasRef} />
}
