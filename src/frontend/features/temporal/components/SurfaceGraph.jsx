import Plot from "react-plotly.js"
import StatusMessage from "@/components/StatusMessage"
import useSurfaceGraph from "../hooks/useSurfaceGraph.js"
import { DISPLAY_MAX_DEG, DISPLAY_MIN_DEG } from "../utils/surfaceCamera.js"

/**
 * Component for rendering the 3D surface graph that visualizes the selected
 * metric across days of the week and hours of the day. All interaction and
 * trace-building logic lives in the useSurfaceGraph handler hook; this
 * component only renders.
 * @param {Object} data - Day-hour statistics used to build the surface graph.
 * @param {string} activeMetric - The currently selected metric key.
 * @param {Function} setCoordinates - Reports the hovered day/hour so the histograms can highlight the matching bars.
 * @param {boolean} loading - Whether the temporal data is currently loading.
 * @param {Error|null} error - Error state for temporal data fetch.
 * @param {Function} onRefetch - Callback to trigger a retry after error.
 * @param {boolean} compareMode - Whether comparison surfaces are pinned.
 * @param {Array} layers - Active compare layers ({ label, dayHourStats, colorscale }).
 * @param {Object} pinnedSlice - The pinned bar ({ type: 'day'|'hour', index, label }) or null; draws an amber slice line on the surface.
 * @param {Array} sliceValues - The pinned slice's metric values (24 for a day pin, 7 for an hour pin).
 * @returns The rendered surface graph.
 */
function SurfaceGraph({
    data,
    activeMetric,
    setCoordinates,
    loading,
    error,
    onRefetch,
    compareMode = false,
    layers = [],
    pinnedSlice = null,
    sliceValues = null,
}) {
    const {
        containerRef,
        angleTrackRef,
        isInteractionDisabled,
        isAngleSliderDisabled,
        isDragging,
        hasTraces,
        canSelectPoints,
        plotTraces,
        plotLayout,
        roundedDisplayAngle,
        anglePercent,
        handleSurfaceClick,
        handleSurfaceHover,
        handleSurfaceUnhover,
        handlePointerDown,
        handlePointerMove,
        stopDragging,
        handleAnglePointerDown,
        handleAnglePointerMove,
        stopAngleDragging,
        handleAngleKeyDown,
    } = useSurfaceGraph({
        data,
        activeMetric,
        setCoordinates,
        loading,
        compareMode,
        layers,
        pinnedSlice,
        sliceValues,
    })

    return (
        <div
            ref={containerRef}
            className="surface-plot-3d"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
            style={{ cursor: isInteractionDisabled ? "wait" : isDragging ? "grabbing" : "grab" }}
        >
            {hasTraces && (
                <Plot
                    data={plotTraces}
                    layout={plotLayout}
                    config={{
                        displayModeBar: false,
                        scrollZoom: false,
                        staticPlot: !canSelectPoints,
                    }}
                    revision={plotTraces.length}
                    useResizeHandler
                    className="w-full h-full"
                    onClick={canSelectPoints ? handleSurfaceClick : undefined}
                    onHover={canSelectPoints ? handleSurfaceHover : undefined}
                    onUnhover={canSelectPoints ? handleSurfaceUnhover : undefined}
                />
            )}
            {(loading || error) && <StatusMessage loading={loading} error={error} onRefetch={onRefetch} />}
            <div className="surface-angle-indicator" onPointerDown={(event) => event.stopPropagation()}>
                <div className="surface-angle-row">
                    <div
                        ref={angleTrackRef}
                        className={`surface-angle-track${isAngleSliderDisabled ? " is-disabled" : ""}`}
                        role="slider"
                        tabIndex={isAngleSliderDisabled ? -1 : 0}
                        aria-label="Surface angle"
                        aria-disabled={isAngleSliderDisabled}
                        aria-valuemin={DISPLAY_MIN_DEG}
                        aria-valuemax={DISPLAY_MAX_DEG}
                        aria-valuenow={roundedDisplayAngle}
                        onPointerDown={handleAnglePointerDown}
                        onPointerMove={handleAnglePointerMove}
                        onPointerUp={stopAngleDragging}
                        onPointerCancel={stopAngleDragging}
                        onKeyDown={handleAngleKeyDown}
                    >
                        <div className="surface-angle-track__line" />
                        <div className="surface-angle-track__thumb" style={{ left: `${anglePercent}%` }} />
                    </div>
                    <div className="surface-angle-ticks">
                        <span className="surface-angle-tick">-90&deg;</span>
                        <span className="surface-angle-tick">90&deg;</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SurfaceGraph
