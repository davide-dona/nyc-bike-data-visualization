import useBarChart from '../hooks/useBarChart.js'

/**
 * Renders a bar chart via Chart.js; recreated only when data/structure
 * change, while highlight/selection updates apply in place so hovering never stutters.
 * @param {string} highlight - Label of the bar to render in the solid color.
 * @param {Array} compareDatasets - Optional [{ label, data, color }] compare datasets.
 * @param {Function} onBarClick - Optional (index, label) callback; enables the pointer cursor over bars.
 * @param {Object} overlayDataset - Optional { label, data } line drawn over the bars (pinned slice from the other chart).
 * @param {string} selectedLabel - Label of the pinned bar, painted in the amber selection color.
 * @param {string} [valueNoun='Rides'] - Tooltip name for the value (e.g. "Rides", "Duration").
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
    valueNoun = 'Rides',
}) {
    const { canvasRef } = useBarChart({
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
        overlayDataset,
        selectedLabel,
        valueNoun,
    })

    return <canvas ref={canvasRef} />
}
