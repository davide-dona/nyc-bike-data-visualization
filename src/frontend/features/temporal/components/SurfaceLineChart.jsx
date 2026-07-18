import Plot from "react-plotly.js";
import ChartFrame from "@/components/ChartFrame.jsx";
import useSurfaceLineChart from "../hooks/useSurfaceLineChart.js";
import { TEMPORAL_TEXT } from "../utils/temporalText.js";

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
            title={`${metric.label}${TEMPORAL_TEXT.lineChart.titleSuffix}`}
            note={`${TEMPORAL_TEXT.lineChart.noteLead}${metric.label}${TEMPORAL_TEXT.lineChart.noteTail}`}
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={!hasData ? TEMPORAL_TEXT.lineChart.emptyMessage : null}
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
