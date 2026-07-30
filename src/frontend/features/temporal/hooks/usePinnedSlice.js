import { useEffect, useMemo, useRef, useState } from "react";
import { buildLayerSliceOverlays } from "../utils/sliceOverlay.js";
import { getMetricConfig } from "../utils/metricFormatter.js";

/**
 * Handler hook for the click-to-pin slice: a single pinned day XOR hour bar,
 * overlaid on the opposite histogram and on the 3D surface, with one series
 * per active layer so the slice stays readable in compare mode. Cleared when
 * the page filters change.
 * @param {string} filtersKey - Stable JSON key of the page filters; a change clears the pin.
 * @param {Array} layers - Active layers backing the slice overlay ({ label, color, dayHourStats }).
 * @param {string} activeMetric - Metric key selecting the overlay value getter.
 * @returns {Object} pinnedSlice, the slice overlay series, and the pin/clear handlers.
 */
export default function usePinnedSlice({ filtersKey, layers, activeMetric }) {
    const [pinnedSlice, setPinnedSlice] = useState(null);
    const previousFiltersKeyRef = useRef(filtersKey);

    const handleSliceBarClick = (type, index, label) => {
        setPinnedSlice((prev) =>
            prev && prev.type === type && prev.index === index
                ? null
                : { type, index, label },
        );
    };

    const handleClearPin = () => setPinnedSlice(null);

    const sliceOverlay = useMemo(
        () =>
            buildLayerSliceOverlays(
                layers,
                pinnedSlice,
                getMetricConfig(activeMetric).get,
            ),
        [layers, pinnedSlice, activeMetric],
    );

    // Changing the page filters repaints every chart, so a stale pin is dropped.
    useEffect(() => {
        if (previousFiltersKeyRef.current === filtersKey) return;
        previousFiltersKeyRef.current = filtersKey;
        setPinnedSlice(null);
    }, [filtersKey]);

    return {
        pinnedSlice,
        sliceOverlay,
        handleSliceBarClick,
        handleClearPin,
    };
}
