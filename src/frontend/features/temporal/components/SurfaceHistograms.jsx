import { getMetricConfig } from "../utils/metricFormatter.js"
import { DAY_LABELS, HOUR_LABELS } from "@/utils/config.js"
import BarChart from "./BarChart.jsx"
import ChartFrame from "@/components/ChartFrame.jsx"

/**
 * The two histograms that accompany the surface graph, one for day of week
 * and one for hour of day.
 * @param {Object} hourData - Hour of day stats rows.
 * @param {Object} dayData - Day of week stats rows.
 * @param {string} activeMetric - The currently selected metric key.
 * @param {Object} coordinates - The hovered surface point, used to highlight the matching bars.
 * @param {boolean} loading - Whether temporal data is loading.
 * @param {Error|null} error - Error state for temporal data fetch.
 * @param {Function} onRefetch - Callback to trigger a retry after error.
 * @param {Object} pinnedSlice - The pinned bar ({ type: 'day'|'hour', index, label }) or null.
 * @param {Object} overlay - The derived overlay series ({ target, label, data }) or null; drawn on the opposite card.
 * @param {Function} onBarClick - (type, index, label) callback when a histogram bar is clicked; absent while comparing.
 * @param {Function} onClearPin - Callback for the overlay chip's dismiss button.
 * @returns The rendered histogram grid.
 */
export default function SurfaceHistograms({
    dayData,
    hourData,
    activeMetric,
    coordinates,
    loading,
    error,
    onRefetch,
    compareMode = false,
    layers = [],
    pinnedSlice = null,
    overlay = null,
    onBarClick = null,
    onClearPin = null,
}) {
    const metric = getMetricConfig(activeMetric)
    const metricDayData = dayData?.map(metric.get)
    const metricHourData = hourData?.map(metric.get)
    const cards = [
        {
            type: "day",
            label: "by day of week",
            data: metricDayData,
            labels: DAY_LABELS,
            highlight: coordinates?.day,
            xAxisTitle: "Day of Week",
            xLabelStep: 1,
        },
        {
            type: "hour",
            label: "by hour of day",
            data: metricHourData,
            labels: HOUR_LABELS,
            highlight: coordinates?.hour,
            xAxisTitle: "Hour of Day",
            xLabelStep: 3,
        },
    ]

    const compareDatasetsByCard = compareMode
        ? {
            "Day of Week": layers.map((layer) => ({
                label: layer.label,
                color: layer.color,
                data: (layer.dayStats ?? []).map(metric.get),
            })),
            "Hour of Day": layers.map((layer) => ({
                label: layer.label,
                color: layer.color,
                data: (layer.hourStats ?? []).map(metric.get),
            })),
        }
        : null

    return (
        <div className="surface-histograms-grid">
            {cards.map(({ type, label, data, labels, highlight, xAxisTitle, xLabelStep }) => {
                const isOverlayTarget = overlay?.target === type
                const selectedLabel = pinnedSlice?.type === type ? pinnedSlice.label : null
                const title = (
                    <>
                        {metric.label} {label}
                        {isOverlayTarget && (
                            <button
                                type="button"
                                className="surface-histogram-chip"
                                onClick={onClearPin ?? undefined}
                                aria-label={`Remove ${overlay.label} overlay`}
                            >
                                {overlay.label} <span aria-hidden="true">×</span>
                            </button>
                        )}
                    </>
                )

                return (
                    <ChartFrame
                        key={label}
                        title={title}
                        status={{ loading, error, refetch: onRefetch }}
                        frameClassName="surface-histogram-card"
                        titleClassName="surface-histogram-card__eyebrow"
                        plotClassName="surface-histogram-chart"
                    >
                        <BarChart
                            data={data}
                            labels={labels}
                            format={metric.format}
                            highlight={highlight}
                            xAxisTitle={xAxisTitle}
                            yAxisTitle={metric.label}
                            unit={metric.unit}
                            xLabelStep={xLabelStep}
                            compareDatasets={compareDatasetsByCard?.[xAxisTitle]}
                            onBarClick={onBarClick ? (index, barLabel) => onBarClick(type, index, barLabel) : null}
                            overlayDataset={isOverlayTarget ? { label: overlay.label, data: overlay.data } : null}
                            selectedLabel={selectedLabel}
                        />
                    </ChartFrame>
                )
            })}
        </div>
    )
}
