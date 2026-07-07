import { useEffect, useMemo, useRef, useState } from "react";
import {
    COMPARE_LAYER_COLORS,
    COMPARE_LAYER_SCALES,
    buildLayerKey,
    buildLayerLabel,
} from "../utils/compareLayers.js";

/**
 * Handler hook owning the compare-mode state machine: panel open/hover state
 * with hover-intent timers, the draft layer filters, the pinned compare
 * layers with add/remove/toggle/reset transitions, duplicate detection, the
 * click-outside close, and the reset when the page filters change.
 * @param {string} filtersKey - Stable JSON key of the page filters; a change resets compare state.
 * @param {string} baseLayerKey - Layer key of the base surface, for duplicate detection.
 * @param {Object} overlayRef - Ref to the plot overlay node, for click-outside detection.
 * @param {Function|null} onCompareModeChange - Notified with true while compare layers are pinned.
 * @returns {Object} Compare state, refs for the panel nodes, and all transition handlers.
 */
export default function useCompareLayerState({ filtersKey, baseLayerKey, overlayRef, onCompareModeChange }) {
    const [isCompareMode, setIsCompareMode] = useState(false);
    const [isCompareHovered, setIsCompareHovered] = useState(false);
    const [pendingLayerFilters, setPendingLayerFilters] = useState({
        user_type: "",
        bike_type: "",
    });
    const [compareLayers, setCompareLayers] = useState([]);
    const previousFiltersKeyRef = useRef(filtersKey);
    const compareButtonRef = useRef(null);
    const comparePanelRef = useRef(null);
    const compareHoverCloseTimeoutRef = useRef(null);
    const addLayerButtonRef = useRef(null);
    const hasPinnedCompareLayers = compareLayers.length > 0;
    const isComparePanelOpen = isCompareMode || isCompareHovered;

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

    // Changing the page filters invalidates every pinned comparison, so the
    // whole compare state resets to its defaults.
    useEffect(() => {
        if (previousFiltersKeyRef.current === filtersKey) return;

        previousFiltersKeyRef.current = filtersKey;
        setIsCompareMode(false);
        setCompareLayers([]);
        setPendingLayerFilters({ user_type: "", bike_type: "" });
    }, [filtersKey]);

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
    }, [isCompareMode, overlayRef]);

    useEffect(
        () => () => {
            if (compareHoverCloseTimeoutRef.current) {
                clearTimeout(compareHoverCloseTimeoutRef.current);
            }
        },
        [],
    );

    return {
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
    };
}
