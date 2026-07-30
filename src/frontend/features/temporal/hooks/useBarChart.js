import { useRef } from 'react'
import useChartJs from '@/hooks/useChartJs.js'
import {
    applyTemporalBarPaint,
    buildTemporalBarChartConfig,
} from '../utils/barChartConfig.js'

/**
 * Handler hook for the temporal bar chart: keeps the paint/click inputs in a
 * live ref so the chart is recreated only when its data or structure change,
 * while highlight/selection updates apply in place.
 * @param {Object} params - Chart inputs.
 * @param {Array} params.data - Bar values.
 * @param {Array} params.labels - X-axis labels.
 * @param {Function} params.format - Value formatter used in tooltips.
 * @param {string|null} params.highlight - Label of the bar rendered in the solid color.
 * @param {string} params.xAxisTitle - X-axis title.
 * @param {string} params.yAxisTitle - Y-axis title.
 * @param {string} params.unit - Metric unit.
 * @param {number} params.xLabelStep - Step between rendered x labels.
 * @param {Array|null} params.compareDatasets - Optional [{ label, data, color }] compare datasets.
 * @param {Function|null} params.onBarClick - Optional (index, label) callback enabling the pointer cursor.
 * @param {Array|null} params.overlayDatasets - Optional [{ label, data, color }] pinned-slice lines drawn over the bars.
 * @param {string|null} params.selectedLabel - Label of the pinned bar, painted in the amber selection color.
 * @param {string} params.valueNoun - Tooltip name for the value.
 * @returns {{canvasRef: Object}} Canvas ref where the Chart.js bar chart is rendered.
 */
export default function useBarChart({
    data,
    labels,
    format,
    highlight,
    xAxisTitle,
    yAxisTitle,
    unit,
    xLabelStep,
    compareDatasets,
    onBarClick,
    overlayDatasets,
    selectedLabel,
    valueNoun,
}) {
    // Read through this ref at call time so changes never recreate the chart.
    const live = useRef({})
    live.current = { highlight, selectedLabel, onBarClick, format }
    const hasBarClick = Boolean(onBarClick)

    const structuralKey = JSON.stringify([
        data,
        labels,
        compareDatasets,
        overlayDatasets,
        xAxisTitle ?? '',
        yAxisTitle ?? '',
        unit ?? '',
        xLabelStep,
        hasBarClick,
        valueNoun,
    ])
    const paintKey = `${highlight}|${selectedLabel}`

    const { canvasRef } = useChartJs({
        buildConfig: () =>
            buildTemporalBarChartConfig({
                data,
                labels,
                compareDatasets,
                overlayDatasets,
                xAxisTitle,
                yAxisTitle,
                unit,
                xLabelStep,
                hasBarClick,
                valueNoun,
                live,
            }),
        structuralKey,
        paintKey,
        applyPaint: (chart) =>
            applyTemporalBarPaint(chart, {
                labels,
                compareDatasets,
                highlight: live.current.highlight,
                selectedLabel: live.current.selectedLabel,
            }),
    })

    return { canvasRef }
}
