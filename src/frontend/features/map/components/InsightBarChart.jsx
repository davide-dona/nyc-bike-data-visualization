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
 * Bar chart for the map insights panel. Recreated only when label structure
 * changes; value/color/highlight changes are applied in place via chart.update('none').
 * @param {Array} labels - Category labels; an array entry renders as a multi-line tick.
 * @param {Array} values - Single-series values (ignored when groups is set).
 * @param {Array} groups - Optional [{ label, values, color }] for grouped bars.
 * @param {boolean} horizontal - Draw bars horizontally (category axis on y).
 * @param {boolean} diverging - Two groups grow from zero in opposite directions.
 * @param {Array} colors - Optional per-bar colors (single-series mode).
 * @param {string} highlightLabel - Label of the bar painted in the selection color.
 * @param {Function} onBarClick - Optional (index, label) callback; enables pointer cursor.
 * @param {Function} formatValue - Formats value-axis ticks and tooltip values.
 * @param {Function} formatTooltipTitle - Optional tooltip title override.
 * @param {Function} formatTooltipLabel - Optional tooltip label override.
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
    // Paint-only props are read through this ref so the chart isn't recreated when they change.
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
