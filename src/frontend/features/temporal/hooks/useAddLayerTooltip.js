import { useEffect, useRef, useState } from "react";

const DUPLICATE_TOOLTIP_TEXT =
    "This surface is already present. Change User Type or Bike Type.";

/**
 * Handler hook for the cursor-following tooltip on the disabled Add Surface
 * button: visibility state, initial position, and RAF-throttled tracking of
 * the mouse inside the plot overlay.
 * @param {Object} overlayRef - Ref to the plot overlay node the tooltip is positioned in.
 * @param {boolean} isActive - Whether the tooltip should show (the draft selection is a duplicate).
 * @returns {Object} showTooltip, tooltipText, tooltipPosition, the tooltip node ref, and the mouse handlers.
 */
export default function useAddLayerTooltip({ overlayRef, isActive }) {
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [showTooltip, setShowTooltip] = useState(false);
    const addLayerTooltipRef = useRef(null);
    const tooltipAnimationFrameRef = useRef(null);

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
        if (!isActive) {
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
        if (!isActive) {
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

    useEffect(
        () => () => {
            if (tooltipAnimationFrameRef.current) {
                cancelAnimationFrame(tooltipAnimationFrameRef.current);
                tooltipAnimationFrameRef.current = null;
            }
        },
        [],
    );

    return {
        showTooltip,
        tooltipText: isActive ? DUPLICATE_TOOLTIP_TEXT : null,
        tooltipPosition,
        addLayerTooltipRef,
        handleAddLayerMouseEnter,
        handleAddLayerMouseMove,
        handleAddLayerMouseLeave,
    };
}
