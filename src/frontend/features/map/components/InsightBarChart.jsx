import { formatCompact } from '@/utils/numberFormat.js'
import useInsightBarChart from '../hooks/useInsightBarChart.js'

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
 * @returns A canvas element where the Chart.js bar chart is rendered.
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
    const { canvasRef } = useInsightBarChart({
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
    })

    return <canvas ref={canvasRef} />
}
