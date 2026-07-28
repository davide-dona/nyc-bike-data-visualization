import { useMemo } from "react";
import {
    BASE_LAYER_ID,
    COMPARE_LAYER_COLORS,
    COMPARE_LAYER_SCALES,
    buildLayerLabel,
} from "../utils/compareLayers.js";

/**
 * Handler hook deriving the chart-facing layer views: the base layer built
 * from the page's own stats, the compare layers merged with their fetched
 * data, the visible layer list, and per-chart loading/error/refetch states
 * that merge each chart's own queries with the compare-layer queries.
 * @param {Object} baseClassFilters - The page's user_type/bike_type filter slice.
 * @param {Object} stats - Result of useTemporalStats (data, loading, error, queries).
 * @param {Array<Object>} compareLayers - Pinned compare layers (without data).
 * @param {boolean} hasPinnedCompareLayers - Whether any compare layer is pinned.
 * @param {boolean} isBaseLayerVisible - Whether the base surface is currently shown.
 * @param {Object} compare - Result of useCompareTemporalLayers (layerData, loading, error, refetch).
 * @returns {Object} baseLayer, comparedLayers, activeLayers, merged states, and per-chart states.
 */
export default function useTemporalLayerViews({
    baseClassFilters,
    stats,
    compareLayers,
    hasPinnedCompareLayers,
    isBaseLayerVisible = true,
    compare,
}) {
    const { dayHourStats, dayStats, hourStats, dateStats, loading, error, queries } = stats;
    const {
        layerData: comparedLayerData,
        loading: compareLoading,
        error: compareError,
        refetch: refetchCompare,
    } = compare;

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
            id: BASE_LAYER_ID,
            label: `Current: ${buildLayerLabel(baseClassFilters)}`,
            color: COMPARE_LAYER_COLORS[0],
            colorscale: COMPARE_LAYER_SCALES[0],
            visible: isBaseLayerVisible,
            dayHourStats,
            dayStats,
            hourStats,
            dateStats,
            loading,
            error,
        }),
        [baseClassFilters, isBaseLayerVisible, dayHourStats, dayStats, hourStats, dateStats, loading, error],
    );

    const activeLayers = useMemo(() => {
        if (!hasPinnedCompareLayers) return [baseLayer];
        return [
            ...(baseLayer.visible ? [baseLayer] : []),
            ...comparedLayers.filter((layer) => layer.visible),
        ];
    }, [hasPinnedCompareLayers, baseLayer, comparedLayers]);

    const mergedLoading = loading || (hasPinnedCompareLayers && compareLoading);
    const mergedError = error || (hasPinnedCompareLayers ? compareError : null);

    // Each chart merges only its own queries so one failed request doesn't blank the others.
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

    return {
        baseLayer,
        comparedLayers,
        activeLayers,
        mergedLoading,
        mergedError,
        surfaceState,
        histogramsState,
        lineChartState,
    };
}
