import { getMetricConfig } from "../utils/metricFormatter.js"
import { DAY_LABELS, HOUR_LABELS } from "@/utils/config.js"
import BarChart from "./BarChart.jsx"
import ChartFrame from "@/components/ChartFrame.jsx"

/**
 * The two histograms accompanying the surface graph: one for day of week,
 * one for hour of day.
 * @param {Object} coordinates - The hovered surface point, used to highlight matching bars.
 * @param {Object} pinnedSlice - The pinned bar ({ type: 'day'|'hour', index, label }) or null.
 * @param {Object} overlay - The derived overlay series ({ target, label, data }) or null; drawn on the opposite card.
 * @param {Function} onBarClick - (type, index, label) callback when a bar is clicked; absent while comparing.
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
    // The day card marginalizes across weekdays (avg per day); the hour card marginalizes
    // across hours (avg per hour) - total_rides means something different in each, so each
    // card gets its own metric config even though both start from the same activeMetric key.
    const dayMetric = getMetricConfig(activeMetric, 'day')
    const hourMetric = getMetricConfig(activeMetric, 'hour')
    const metricDayData = dayData?.map(dayMetric.get)
    const metricHourData = hourData?.map(hourMetric.get)
    const cards = [
        {
            type: "day",
            label: "by day of week",
            data: metricDayData,
            labels: DAY_LABELS,
            highlight: coordinates?.day,
            xAxisTitle: "Day of Week",
            xLabelStep: 1,
            metric: dayMetric,
        },
        {
            type: "hour",
            label: "by hour of day",
            data: metricHourData,
            labels: HOUR_LABELS,
            highlight: coordinates?.hour,
            xAxisTitle: "Hour of Day",
            xLabelStep: 3,
            metric: hourMetric,
        },
    ]

    const compareDatasetsByCard = compareMode
        ? {
            "Day of Week": layers.map((layer) => ({
                label: layer.label,
                color: layer.color,
                data: (layer.dayStats ?? []).map(dayMetric.get),
            })),
            "Hour of Day": layers.map((layer) => ({
                label: layer.label,
                color: layer.color,
                data: (layer.hourStats ?? []).map(hourMetric.get),
            })),
        }
        : null

    return (
        <div className="surface-histograms-grid">
            {cards.map(({ type, label, data, labels, highlight, xAxisTitle, xLabelStep, metric }) => {
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
                            valueNoun={metric.noun}
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
