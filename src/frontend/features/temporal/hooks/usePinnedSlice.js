import { useEffect, useMemo, useRef, useState } from "react";
import { buildSliceOverlay } from "../utils/sliceOverlay.js";
import { getMetricConfig } from "../utils/metricFormatter.js";

/**
 * Handler hook for the click-to-pin slice: a single pinned day XOR hour bar,
 * overlaid on the opposite histogram and on the 3D surface. Never active
 * while compare layers are pinned; cleared when the page filters change.
 * @param {string} filtersKey - Stable JSON key of the page filters; a change clears the pin.
 * @param {boolean} hasPinnedCompareLayers - Whether compare layers took over the charts.
 * @param {Array} dayHourStats - Day-hour grid backing the slice overlay.
 * @param {string} activeMetric - Metric key selecting the overlay value getter.
 * @returns {Object} pinnedSlice, the slice overlay data, and the pin/clear handlers.
 */
export default function usePinnedSlice({ filtersKey, hasPinnedCompareLayers, dayHourStats, activeMetric }) {
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

    const sliceOverlay = useMemo(() => {
        if (hasPinnedCompareLayers) return null;
        return buildSliceOverlay(
            dayHourStats,
            pinnedSlice,
            getMetricConfig(activeMetric).get,
        );
    }, [hasPinnedCompareLayers, dayHourStats, pinnedSlice, activeMetric]);

    // Changing the page filters repaints every chart, so a stale pin is dropped.
    useEffect(() => {
        if (previousFiltersKeyRef.current === filtersKey) return;
        previousFiltersKeyRef.current = filtersKey;
        setPinnedSlice(null);
    }, [filtersKey]);

    // Pinned compare layers take over the charts; drop the slice pin
    useEffect(() => {
        if (hasPinnedCompareLayers) setPinnedSlice(null);
    }, [hasPinnedCompareLayers]);

    return {
        pinnedSlice,
        sliceOverlay,
        handleSliceBarClick,
        handleClearPin,
    };
}
