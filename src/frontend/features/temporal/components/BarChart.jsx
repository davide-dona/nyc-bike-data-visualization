import { useRef } from "react"
import useChartJs from "@/hooks/useChartJs.js"
import {
    applyTemporalBarPaint,
    buildTemporalBarChartConfig,
} from "../utils/barChartConfig.js"

/**
 * Renders a bar chart via Chart.js; recreated only when data/structure
 * change, while highlight/selection updates apply in place so hovering never stutters.
 * @param {string} highlight - Label of the bar to render in the solid color.
 * @param {Array} compareDatasets - Optional [{ label, data, color }] compare datasets.
 * @param {Function} onBarClick - Optional (index, label) callback; enables the pointer cursor over bars.
 * @param {Object} overlayDataset - Optional { label, data } line drawn over the bars (pinned slice from the other chart).
 * @param {string} selectedLabel - Label of the pinned bar, painted in the amber selection color.
 * @returns A canvas element where the Chart.js bar chart is rendered.
 */
export default function BarChart({
    data = [],
    labels = [],
    format,
    highlight = null,
    xAxisTitle,
    yAxisTitle,
    unit,
    xLabelStep = 1,
    compareDatasets = null,
    onBarClick = null,
    overlayDataset = null,
    selectedLabel = null,
}) {
    // Read through this ref at call time so changes never recreate the chart.
    const live = useRef({})
    live.current = { highlight, selectedLabel, onBarClick, format }
    const hasBarClick = Boolean(onBarClick)

    const structuralKey = JSON.stringify([
        data,
        labels,
        compareDatasets,
        overlayDataset,
        xAxisTitle ?? '',
        yAxisTitle ?? '',
        unit ?? '',
        xLabelStep,
        hasBarClick,
    ])
    const paintKey = `${highlight}|${selectedLabel}`

    const { canvasRef } = useChartJs({
        buildConfig: () =>
            buildTemporalBarChartConfig({
                data,
                labels,
                compareDatasets,
                overlayDataset,
                xAxisTitle,
                yAxisTitle,
                unit,
                xLabelStep,
                hasBarClick,
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

    return <canvas ref={canvasRef} />
}
