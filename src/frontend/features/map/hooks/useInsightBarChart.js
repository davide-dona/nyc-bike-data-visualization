import { useRef } from 'react'
import useChartJs from '@/hooks/useChartJs.js'
import {
    KEY_SEPARATOR,
    applyBarPaint,
    buildInsightBarChartConfig,
    keyToLabel,
    labelToKey,
} from '../utils/insightBarChart.js'

/**
 * Handler hook for the map insights bar chart: keeps paint-only inputs in a
 * live ref so the chart is recreated only when its label/group structure
 * changes, while value/color/highlight updates apply in place.
 * @param {Object} params - Chart inputs.
 * @param {Array} params.labels - Category labels; an array entry renders as a multi-line tick.
 * @param {Array} params.values - Single-series values (ignored when groups is set).
 * @param {Array} params.groups - Optional [{ label, values, color }] for grouped bars.
 * @param {boolean} params.horizontal - Draw bars horizontally (category axis on y).
 * @param {boolean} params.diverging - Two groups grow from zero in opposite directions.
 * @param {Array} params.colors - Optional per-bar colors (single-series mode).
 * @param {string} params.highlightLabel - Label of the bar painted in the selection color.
 * @param {Function} params.onBarClick - Optional (index, label) callback; enables pointer cursor.
 * @param {string} params.xAxisTitle - X-axis title.
 * @param {string} params.yAxisTitle - Y-axis title.
 * @param {Function} params.formatValue - Formats value-axis ticks and tooltip values.
 * @param {Function} params.formatTooltipTitle - Optional tooltip title override.
 * @param {Function} params.formatTooltipLabel - Optional tooltip label override.
 * @param {number} params.xLabelStep - Show every Nth category tick on vertical charts.
 * @returns {{canvasRef: Object}} Canvas ref where the Chart.js bar chart is rendered.
 */
export default function useInsightBarChart({
    labels,
    values,
    groups,
    horizontal,
    diverging,
    colors,
    highlightLabel,
    onBarClick,
    xAxisTitle,
    yAxisTitle,
    formatValue,
    formatTooltipTitle,
    formatTooltipLabel,
    xLabelStep,
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

    return { canvasRef }
}
