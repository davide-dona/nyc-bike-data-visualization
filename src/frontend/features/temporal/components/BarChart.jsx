import { useRef } from "react"
import useChartJs from "@/hooks/useChartJs.js"
import {
    applyTemporalBarPaint,
    buildTemporalBarChartConfig,
} from "../utils/barChartConfig.js"

/**
 * Component for rendering a bar chart using Chart.js, with support for highlighting a specific bar based on the provided highlight value.
 * The chart is recreated only when its data/structure changes; highlight and
 * selection changes are applied in place so hovering never stutters.
 * @param {Array} data - The array of values to be displayed as bars in the chart.
 * @param {Array} labels - The array of labels corresponding to each bar in the chart.
 * @param {Function} format - A function to format the tooltip values when hovering over the bars.
 * @param {string} highlight - The label of the bar that should be highlighted, used to determine which bar gets the solid color and which ones get the muted color.
 * @param {string} xAxisTitle - Title of the x axis.
 * @param {string} yAxisTitle - Title of the y axis.
 * @param {string} unit - Unit appended to y-axis ticks.
 * @param {number} xLabelStep - Show every Nth category tick.
 * @param {Array} compareDatasets - Optional [{ label, data, color }] compare datasets.
 * @param {Function} onBarClick - Optional (index, label) callback fired when a bar is clicked; also enables the pointer cursor over bars.
 * @param {Object} overlayDataset - Optional { label, data } line series drawn on top of the bars (the pinned slice from the other chart).
 * @param {string} selectedLabel - The label of the pinned bar, painted in the amber selection color.
 * @returns A canvas element where the Chart.js bar chart will be rendered.
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
    // Highlight/selection/callback props are read through this ref at call
    // time so their changes never recreate the chart.
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
