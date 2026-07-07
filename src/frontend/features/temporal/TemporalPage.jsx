import { useEffect, useMemo, useRef, useState } from "react";
import useTemporalState from "./hooks/useTemporalState";
import useCompareTemporalLayers from "./hooks/useCompareTemporalLayers.js";
import MetricSelector from "./components/MetricSelector";
import SurfaceGraph from "./components/SurfaceGraph";
import SurfaceHistograms from "./components/SurfaceHistograms";
import SurfaceLineChart from "./components/SurfaceLineChart.jsx";
import CompareControlPanel from "./components/CompareControlPanel.jsx";
import CompareLayerList from "./components/CompareLayerList.jsx";
import AddLayerTooltip from "./components/AddLayerTooltip.jsx";
import VisualizationGuide from "../../components/VisualizationGuide";
import {
    COMPARE_LAYER_COLORS,
    COMPARE_LAYER_SCALES,
    buildLayerKey,
    buildLayerLabel,
    stripClassFilters,
} from "./utils/compareLayers.js";
import { buildSliceOverlay } from "./utils/sliceOverlay.js";
import { getMetricConfig } from "./utils/metricFormatter.js";

/**
 * Component for the temporal stats page, which includes a metric selector, the surface graph itself, and accompanying histograms.
 * @param {Object} filters - The filters to apply to the data.
 * @returns The rendered TemporalPage component, which displays the surface graph and histograms based on the selected metric and applied filters.
 */
function TemporalPage({ filters, onCompareModeChange }) {
    // Use the custom hook to manage the temporal state, including the active metric, hovered coordinates, and fetched data for the surface graph and histograms. The hook also provides loading and error states to handle the data fetching process.
    const {
        activeMetric,
        setActiveMetric,
        coordinates,
        setCoordinates,
        dayHourStats,
        dayStats,
        hourStats,
        dateStats,
        loading,
        error,
        queries,
    } = useTemporalState(filters);
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [isCompareHovered, setIsCompareHovered] = useState(false);
    const [pendingLayerFilters, setPendingLayerFilters] = useState({
        user_type: "",
        bike_type: "",
    });
    const [compareLayers, setCompareLayers] = useState([]);
    // Click-to-pin slice: a single pinned day XOR hour bar, overlaid on the
    // opposite histogram and on the 3D surface. Never active while comparing.
    const [pinnedSlice, setPinnedSlice] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [showTooltip, setShowTooltip] = useState(false);
    const previousFiltersRef = useRef(filters);
    const overlayRef = useRef(null);
    const compareButtonRef = useRef(null);
    const comparePanelRef = useRef(null);
    const compareHoverCloseTimeoutRef = useRef(null);
    const addLayerButtonRef = useRef(null);
    const addLayerTooltipRef = useRef(null);
    const tooltipAnimationFrameRef = useRef(null);
    const hasPinnedCompareLayers = compareLayers.length > 0;
    const isComparePanelOpen = isCompareMode || isCompareHovered;

    const baseClassFilters = useMemo(
        () => ({
            user_type: filters?.user_type,
            bike_type: filters?.bike_type,
        }),
        [filters],
    );

    const baseLayerKey = useMemo(
        () => buildLayerKey(baseClassFilters),
        [baseClassFilters],
    );

    const {
        layerData: comparedLayerData,
        loading: compareLoading,
        error: compareError,
        refetch: refetchCompare,
    } = useCompareTemporalLayers({
        filters: stripClassFilters(filters),
        layers: compareLayers,
        enabled: hasPinnedCompareLayers,
    });

    const comparedLayers = useMemo(
        () =>
            compareLayers.map((layer) => ({
                ...layer,
                ...(comparedLayerData.find(
                    (entry) => entry.id === layer.id,
                ) ?? {
                    dayHourStats: [],
                    dayStats: [],
                    hourStats: [],
                    dateStats: [],
                    loading: false,
                    error: null,
                }),
            })),
        [compareLayers, comparedLayerData],
    );

    const baseLayer = useMemo(
        () => ({
            id: "base-layer",
            label: `Current: ${buildLayerLabel(baseClassFilters)}`,
            color: COMPARE_LAYER_COLORS[0],
            colorscale: COMPARE_LAYER_SCALES[0],
            visible: true,
            dayHourStats,
            dayStats,
            hourStats,
            dateStats,
            loading,
            error,
        }),
        [baseClassFilters, dayHourStats, dayStats, hourStats, dateStats, loading, error],
    );

    const activeLayers = useMemo(() => {
        if (!hasPinnedCompareLayers) return [baseLayer];
        return [baseLayer, ...comparedLayers.filter((layer) => layer.visible)];
    }, [hasPinnedCompareLayers, baseLayer, comparedLayers]);

    const mergedLoading = loading || (hasPinnedCompareLayers && compareLoading);
    const mergedError = error || (hasPinnedCompareLayers ? compareError : null);
    const isActionsDisabled = mergedLoading || mergedError;

    // Per-chart states: each chart merges only its own queries with the
    // compare-layer queries it renders, so one failed request does not blank
    // the other charts.
    const withCompare = (chartQueries) => ({
        loading: chartQueries.some((q) => q.loading) || (hasPinnedCompareLayers && compareLoading),
        error: chartQueries.find((q) => q.error)?.error
            ?? (hasPinnedCompareLayers ? compareError : null),
        refetch: () =>
            Promise.all([
                ...chartQueries.map((q) => q.refetch()),
                hasPinnedCompareLayers ? refetchCompare() : Promise.resolve(),
            ]),
    });
    const surfaceState = withCompare([queries.dayHour]);
    const histogramsState = withCompare([queries.day, queries.hour]);
    const lineChartState = withCompare([queries.date]);

    const handleCompareToggle = () => {
        // If the panel is currently closed but hovered, open it without toggling (to prevent accidental close when moving mouse between button and panel)
        if (!isCompareMode && isCompareHovered) {
            if (compareHoverCloseTimeoutRef.current) {
                clearTimeout(compareHoverCloseTimeoutRef.current);
                compareHoverCloseTimeoutRef.current = null;
            }
            setIsCompareMode(true);
            setIsCompareHovered(false);
        } else {
            // Otherwise, toggle the compare mode as usual
            setIsCompareMode((prev) => !prev);
        }
    };

    const handleCompareHoverEnter = () => {
        if (compareHoverCloseTimeoutRef.current) {
            clearTimeout(compareHoverCloseTimeoutRef.current);
            compareHoverCloseTimeoutRef.current = null;
        }

        setIsCompareHovered(true);
    };

    const closeCompareHoverWithDelay = () => {
        if (compareHoverCloseTimeoutRef.current) {
            clearTimeout(compareHoverCloseTimeoutRef.current);
        }

        compareHoverCloseTimeoutRef.current = setTimeout(() => {
            setIsCompareHovered(false);
            compareHoverCloseTimeoutRef.current = null;
        }, 120);
    };

    const handleCompareHoverLeave = (event) => {
        const nextTarget = event.relatedTarget;
        const buttonNode = compareButtonRef.current;
        const panelNode = comparePanelRef.current;

        if (!(nextTarget instanceof Node)) {
            closeCompareHoverWithDelay();
            return;
        }

        const isInsideButton = buttonNode
            ? buttonNode.contains(nextTarget)
            : false;
        const isInsidePanel = panelNode
            ? panelNode.contains(nextTarget)
            : false;

        if (isInsideButton || isInsidePanel) {
            return;
        }

        closeCompareHoverWithDelay();
    };

    const handlePendingFilterChange = (key, value) => {
        setPendingLayerFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleAddLayer = () => {
        const normalizedFilters = {
            user_type: pendingLayerFilters.user_type || undefined,
            bike_type: pendingLayerFilters.bike_type || undefined,
        };
        const candidateKey = buildLayerKey(normalizedFilters);

        if (candidateKey === baseLayerKey) return;

        const hasDuplicate = compareLayers.some(
            (layer) => buildLayerKey(layer.filters) === candidateKey,
        );
        if (hasDuplicate) return;

        const colorIndex =
            (compareLayers.length + 1) % COMPARE_LAYER_COLORS.length;

        setCompareLayers((prev) => [
            ...prev,
            {
                id: `compare-layer-${Date.now()}-${prev.length}`,
                filters: normalizedFilters,
                label: buildLayerLabel(normalizedFilters),
                color: COMPARE_LAYER_COLORS[colorIndex],
                colorscale: COMPARE_LAYER_SCALES[colorIndex],
                visible: true,
            },
        ]);

        if (compareHoverCloseTimeoutRef.current) {
            clearTimeout(compareHoverCloseTimeoutRef.current);
            compareHoverCloseTimeoutRef.current = null;
        }
        setIsCompareMode(false);
        setIsCompareHovered(false);
    };

    const handleSliceBarClick = (type, index, label) => {
        setPinnedSlice((prev) =>
            prev && prev.type === type && prev.index === index
                ? null
                : { type, index, label },
        );
    };

    const handleClearPin = () => setPinnedSlice(null);

    const sliceOverlay = useMemo(() => {
        if (hasPinnedCompareLayers) return null;
        return buildSliceOverlay(
            dayHourStats,
            pinnedSlice,
            getMetricConfig(activeMetric).get,
        );
    }, [hasPinnedCompareLayers, dayHourStats, pinnedSlice, activeMetric]);

    const handleResetCompare = () => {
        setCompareLayers([]);
        setPendingLayerFilters({ user_type: "", bike_type: "" });
    };

    const handleRemoveLayer = (layerId) => {
        setCompareLayers((prev) =>
            prev.filter((layer) => layer.id !== layerId),
        );
    };

    const handleToggleLayerVisibility = (layerId) => {
        setCompareLayers((prev) =>
            prev.map((layer) =>
                layer.id === layerId
                    ? { ...layer, visible: !layer.visible }
                    : layer,
            ),
        );
    };

    const pendingCandidateKey = useMemo(
        () =>
            buildLayerKey({
                user_type: pendingLayerFilters.user_type || undefined,
                bike_type: pendingLayerFilters.bike_type || undefined,
            }),
        [pendingLayerFilters],
    );

    const isPendingSelectionDuplicate = useMemo(() => {
        if (pendingCandidateKey === baseLayerKey) return true;
        return compareLayers.some(
            (layer) => buildLayerKey(layer.filters) === pendingCandidateKey,
        );
    }, [baseLayerKey, compareLayers, pendingCandidateKey]);

    useEffect(() => {
        if (!onCompareModeChange) return;

        onCompareModeChange(hasPinnedCompareLayers);

        return () => {
            onCompareModeChange(false);
        };
    }, [hasPinnedCompareLayers, onCompareModeChange]);

    useEffect(() => {
        const previousFilters = previousFiltersRef.current ?? {};
        const filtersChanged =
            JSON.stringify(previousFilters) !== JSON.stringify(filters ?? {});

        if (!filtersChanged) return;

        previousFiltersRef.current = filters;
        setPinnedSlice(null);

        if (!isCompareMode && compareLayers.length === 0) return;

        setIsCompareMode(false);
        setCompareLayers([]);
        setPendingLayerFilters({ user_type: "", bike_type: "" });
    }, [filters, isCompareMode, compareLayers.length]);

    // Pinned compare layers take over the charts; drop the slice pin
    useEffect(() => {
        if (hasPinnedCompareLayers) setPinnedSlice(null);
    }, [hasPinnedCompareLayers]);

    useEffect(() => {
        if (!isCompareMode) return;

        const handleClickOutsideOverlay = (event) => {
            const overlayNode = overlayRef.current;
            if (!overlayNode) return;

            if (!overlayNode.contains(event.target)) {
                setIsCompareMode(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutsideOverlay);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutsideOverlay,
            );
        };
    }, [isCompareMode]);

    useEffect(
        () => () => {
            if (compareHoverCloseTimeoutRef.current) {
                clearTimeout(compareHoverCloseTimeoutRef.current);
            }

            if (tooltipAnimationFrameRef.current) {
                cancelAnimationFrame(tooltipAnimationFrameRef.current);
                tooltipAnimationFrameRef.current = null;
            }
        },
        [],
    );

    const positionAddLayerTooltip = (clientX, clientY) => {
        const overlayRect = overlayRef.current?.getBoundingClientRect();
        const tooltipNode = addLayerTooltipRef.current;
        if (!overlayRect || !tooltipNode) return;

        const nextX = clientX - overlayRect.left;
        const nextY = clientY - overlayRect.top - 12;

        if (tooltipAnimationFrameRef.current) {
            cancelAnimationFrame(tooltipAnimationFrameRef.current);
        }

        tooltipAnimationFrameRef.current = requestAnimationFrame(() => {
            tooltipNode.style.left = `${nextX}px`;
            tooltipNode.style.top = `${nextY}px`;
            tooltipAnimationFrameRef.current = null;
        });
    };

    const handleAddLayerMouseEnter = (event) => {
        if (!isPendingSelectionDuplicate) {
            setShowTooltip(false);
            return;
        }

        const overlayRect = overlayRef.current?.getBoundingClientRect();
        if (overlayRect) {
            setTooltipPosition({
                x: event.clientX - overlayRect.left,
                y: event.clientY - overlayRect.top - 12,
            });
        }
        setShowTooltip(true);
    };

    const handleAddLayerMouseMove = (event) => {
        if (!isPendingSelectionDuplicate) {
            setShowTooltip(false);
            return;
        }

        positionAddLayerTooltip(event.clientX, event.clientY);
    };

    const handleAddLayerMouseLeave = () => {
        if (tooltipAnimationFrameRef.current) {
            cancelAnimationFrame(tooltipAnimationFrameRef.current);
            tooltipAnimationFrameRef.current = null;
        }
        setShowTooltip(false);
    };

    const getAddLayerTooltipText = () => {
        if (isPendingSelectionDuplicate) {
            return "This surface is already present. Change User Type or Bike Type.";
        }
        return null;
    };

    return (
        <section className="page-card">
            <header className="page-card__header">
                <div className="page-card__heading">
                    <span className="page-card__eyebrow">02 - Rhythms</span>
                    <h2 className="page-card__title">
                        The week, hour by hour.
                    </h2>
                    <p className="page-card__subtitle">
                        How ridership swells and recedes across days of the week
                        and hours of the day.
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

                        {showTooltip && getAddLayerTooltipText() && (
                            <AddLayerTooltip
                                text={getAddLayerTooltipText()}
                                position={tooltipPosition}
                                tooltipRef={addLayerTooltipRef}
                            />
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

                <VisualizationGuide
                    mapName="Weekly Rhythm"
                    title="How To Read It"
                    summary="The 3D surface maps your metric across every day-hour cell. In Compare mode, you can overlay multiple surfaces to inspect how rhythms shift between user and bike groups, while histograms help verify aggregate day/hour effects."
                    hints={[
                        {
                            title: "Start from the baseline",
                            text: "Read the Current surface first, then add comparison surfaces one at a time so differences in ridges and peaks remain interpretable.",
                        },
                        {
                            title: "Use Compare as context",
                            text: "Add multiple user/bike combinations from Compare, then use Hide/Show to isolate one layer at a time and confirm whether a pattern is global or segment-specific.",
                        },
                        {
                            title: "Cross-check with histograms",
                            text: "When a surface appears higher in one region, confirm if the gap is driven by specific days or hours using the aligned histogram panels.",
                        },
                    ]}
                />
            </div>
        </section>
    );
}

export default TemporalPage;
