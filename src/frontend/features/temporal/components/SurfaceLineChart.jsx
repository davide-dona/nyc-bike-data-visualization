import Plot from "react-plotly.js";
import StatusMessage from "@/components/StatusMessage.jsx";
import useSurfaceLineChart from "../hooks/useSurfaceLineChart.js";

/**
 * Per-date line chart of the selected metric, drawing one line per layer in
 * compare mode. All trace/layout building lives in the useSurfaceLineChart
 * handler hook; this component only renders.
 * @param {Array} dateData - Per-date stats rows of the base layer.
 * @param {string} activeMetric - Selected metric key.
 * @param {boolean} loading - Whether the chart's queries are in flight.
 * @param {any} error - Error state of the chart's queries.
 * @param {Function} onRefetch - Retry callback.
 * @param {boolean} compareMode - Whether compare layers are pinned.
 * @param {Array} layers - Visible layers (base plus compare layers).
 * @returns The rendered line chart panel.
 */
function SurfaceLineChart({
    dateData,
    activeMetric,
    loading,
    error,
    onRefetch,
    compareMode = false,
    layers = [],
}) {
    const { metric, traces, hasData, plotLayout } = useSurfaceLineChart({
        dateData,
        activeMetric,
        compareMode,
        layers,
    });
    const showOverlay = loading || error;

    return (
        <div className={`surface-card${showOverlay ? " surface-card--hidden" : ""}`}>
            <p className="surface-card__eyebrow">
                {metric.label} over selected time range
            </p>

            <div className="surface-chart">
                {hasData ? (
                    <Plot
                        data={traces}
                        layout={plotLayout}
                        config={{
                            displayModeBar: false,
                            scrollZoom: false,
                        }}
                        className="w-full h-full"
                    />
                ) : (
                    <div className="surface-empty">No daily stats available for this selection.</div>
                )}
            </div>

            {showOverlay && <StatusMessage loading={loading} error={error} onRefetch={onRefetch} />}
        </div>
    );
}

export default SurfaceLineChart;
