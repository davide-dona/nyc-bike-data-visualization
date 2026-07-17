import Plot from "react-plotly.js";
import ChartFrame from "@/components/ChartFrame.jsx";
import useSurfaceLineChart from "../hooks/useSurfaceLineChart.js";

/**
 * Per-date line chart of the selected metric, drawing one line per layer in
 * compare mode. All trace/layout building lives in the useSurfaceLineChart
 * hook; this component only renders.
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

    return (
        <ChartFrame
            title={`${metric.label} over selected time range`}
            note={`This line chart shows the daily breakdown of ${metric.label} over the selected time range, helping you spot key trends and easily identify anomalies.`}
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={!hasData ? "No daily stats available for this selection." : null}
            frameClassName="surface-card"
            titleClassName="surface-card__eyebrow"
            plotClassName="surface-chart"
        >
            <Plot
                data={traces}
                layout={plotLayout}
                config={{
                    displayModeBar: false,
                    scrollZoom: false,
                }}
                className="w-full h-full"
            />
        </ChartFrame>
    );
}

export default SurfaceLineChart;
