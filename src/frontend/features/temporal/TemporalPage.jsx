import useTemporalStats from "./hooks/useTemporalStats.js";
import useTemporalPageState from "./hooks/useTemporalPageState.js";
import useCompareTemporalLayers from "./hooks/useCompareTemporalLayers.js";
import useCompareLayerState from "./hooks/useCompareLayerState.js";
import useTemporalLayerViews from "./hooks/useTemporalLayerViews.js";
import usePinnedSlice from "./hooks/usePinnedSlice.js";
import useAddLayerTooltip from "./hooks/useAddLayerTooltip.js";
import MetricSelector from "./components/MetricSelector";
import SurfaceGraph from "./components/SurfaceGraph";
import SurfaceHistograms from "./components/SurfaceHistograms";
import SurfaceLineChart from "./components/SurfaceLineChart.jsx";
import CompareControlPanel from "./components/CompareControlPanel.jsx";
import CompareLayerList from "./components/CompareLayerList.jsx";
import FloatingTooltip from "@/components/FloatingTooltip.jsx";
import VisualizationGuide from "../../components/VisualizationGuide";
import { stripClassFilters } from "./utils/compareLayers.js";
import { TEMPORAL_GUIDE } from "./utils/temporalGuide.js";

/**
 * Page for the temporal stats: composes the metric selector, the 3D surface
 * graph with its compare panel, the day/hour histograms, and the date line
 * chart. All state lives in the temporal handler hooks; this page only wires
 * their results into components.
 * @param {Object} filters - The filters to apply to the data.
 * @param {Function|null} onCompareModeChange - Notified while compare layers are pinned.
 * @returns The rendered TemporalPage.
 */
function TemporalPage({ filters, onCompareModeChange }) {
    const {
        activeMetric,
        setActiveMetric,
        coordinates,
        setCoordinates,
        overlayRef,
        filtersKey,
        baseClassFilters,
        baseLayerKey,
    } = useTemporalPageState(filters);

    const stats = useTemporalStats(filters);

    const {
        isCompareMode,
        isCompareHovered,
        isComparePanelOpen,
        hasPinnedCompareLayers,
        pendingLayerFilters,
        compareLayers,
        isPendingSelectionDuplicate,
        compareButtonRef,
        comparePanelRef,
        addLayerButtonRef,
        handleCompareToggle,
        handleCompareHoverEnter,
        handleCompareHoverLeave,
        handlePendingFilterChange,
        handleAddLayer,
        handleRemoveLayer,
        handleToggleLayerVisibility,
        handleResetCompare,
    } = useCompareLayerState({ filtersKey, baseLayerKey, overlayRef, onCompareModeChange });

    const compare = useCompareTemporalLayers({
        filters: stripClassFilters(filters),
        layers: compareLayers,
        enabled: hasPinnedCompareLayers,
    });

    const {
        baseLayer,
        comparedLayers,
        activeLayers,
        mergedLoading,
        mergedError,
        surfaceState,
        histogramsState,
        lineChartState,
    } = useTemporalLayerViews({
        baseClassFilters,
        stats,
        compareLayers,
        hasPinnedCompareLayers,
        compare,
    });

    const {
        pinnedSlice,
        sliceOverlay,
        handleSliceBarClick,
        handleClearPin,
    } = usePinnedSlice({
        filtersKey,
        hasPinnedCompareLayers,
        dayHourStats: stats.dayHourStats,
        activeMetric,
    });

    const {
        showTooltip,
        tooltipText,
        tooltipPosition,
        addLayerTooltipRef,
        handleAddLayerMouseEnter,
        handleAddLayerMouseMove,
        handleAddLayerMouseLeave,
    } = useAddLayerTooltip({ isActive: isPendingSelectionDuplicate });

    const isActionsDisabled = mergedLoading || mergedError;

    return (
        <section className="page-card">
            <header className="page-card__header">
                <div className="page-card__heading">
                    <span className="page-card__eyebrow">Habits</span>
                    <h2 className="page-card__title">
                        The week, hour by hour.
                    </h2>
                    <p className="page-card__subtitle">
                        See how rider habits and daily behaviors shape the rise and fall of ridership across hours and days.
                    </p>
                </div>
                <div
                    className={`page-card__actions${isActionsDisabled ? " surface-actions--disabled" : ""}`}
                    aria-disabled={isActionsDisabled}
                >
                    <MetricSelector
                        activeMetric={activeMetric}
                        setActiveMetric={setActiveMetric}
                        disabled={isActionsDisabled}
                    />
                </div>
            </header>
            <div className="page-card__body">
                <div className="surface-plot-stack">
                    <SurfaceGraph
                        data={baseLayer.dayHourStats}
                        activeMetric={activeMetric}
                        setCoordinates={setCoordinates}
                        loading={surfaceState.loading}
                        error={surfaceState.error}
                        onRefetch={surfaceState.refetch}
                        compareMode={hasPinnedCompareLayers}
                        layers={activeLayers}
                        pinnedSlice={hasPinnedCompareLayers ? null : pinnedSlice}
                        sliceValues={sliceOverlay?.data ?? null}
                    />

                    <div ref={overlayRef} className={"surface-plot-overlay"}>
                        <CompareControlPanel
                            isOpen={isComparePanelOpen}
                            isActive={(isCompareMode || isCompareHovered) && !mergedLoading}
                            disabled={mergedLoading || mergedError}
                            pendingLayerFilters={pendingLayerFilters}
                            onPendingFilterChange={handlePendingFilterChange}
                            onAddLayer={handleAddLayer}
                            isAddDisabled={isPendingSelectionDuplicate}
                            onResetCompare={handleResetCompare}
                            canReset={compareLayers.length > 0}
                            onToggle={handleCompareToggle}
                            onHoverEnter={handleCompareHoverEnter}
                            onHoverLeave={handleCompareHoverLeave}
                            addLayerMouseHandlers={{
                                onMouseEnter: handleAddLayerMouseEnter,
                                onMouseMove: handleAddLayerMouseMove,
                                onMouseLeave: handleAddLayerMouseLeave,
                            }}
                            buttonRef={compareButtonRef}
                            panelRef={comparePanelRef}
                            addLayerButtonRef={addLayerButtonRef}
                        >
                            <CompareLayerList
                                baseLayer={baseLayer}
                                layers={comparedLayers}
                                onToggleVisibility={handleToggleLayerVisibility}
                                onRemove={handleRemoveLayer}
                            />
                        </CompareControlPanel>

                        {tooltipText && (
                            <FloatingTooltip
                                visible={showTooltip}
                                position={tooltipPosition}
                                nodeRef={addLayerTooltipRef}
                                className="surface-compare-add-tooltip"
                            >
                                {tooltipText}
                            </FloatingTooltip>
                        )}
                    </div>
                </div>

                <SurfaceHistograms
                    hourData={baseLayer.hourStats}
                    dayData={baseLayer.dayStats}
                    activeMetric={activeMetric}
                    coordinates={coordinates}
                    loading={histogramsState.loading}
                    error={histogramsState.error}
                    onRefetch={histogramsState.refetch}
                    compareMode={hasPinnedCompareLayers}
                    layers={activeLayers}
                    pinnedSlice={hasPinnedCompareLayers ? null : pinnedSlice}
                    overlay={sliceOverlay}
                    onBarClick={hasPinnedCompareLayers ? null : handleSliceBarClick}
                    onClearPin={handleClearPin}
                />

                <SurfaceLineChart
                    dateData={baseLayer.dateStats}
                    activeMetric={activeMetric}
                    loading={lineChartState.loading}
                    error={lineChartState.error}
                    onRefetch={lineChartState.refetch}
                    compareMode={hasPinnedCompareLayers}
                    layers={activeLayers}
                />

                <VisualizationGuide {...TEMPORAL_GUIDE} />
            </div>
        </section>
    );
}

export default TemporalPage;
