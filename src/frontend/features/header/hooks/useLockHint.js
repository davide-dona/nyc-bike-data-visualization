import { useCallback, useRef, useState } from "react";

/**
 * Handler hook for the cursor-anchored "filters are locked" hint: visibility,
 * viewport-clamped position, and the mouse handlers that drive both.
 * @param {boolean} isActive - Whether the hint may show (filters currently locked).
 * @returns {Object} isLockHintVisible, lockHintPosition, the hint node ref, and the mouse handlers.
 */
export default function useLockHint({ isActive }) {
    const [isLockHintVisible, setIsLockHintVisible] = useState(false);
    const [lockHintPosition, setLockHintPosition] = useState({ x: 0, y: 0 });
    const lockHintRef = useRef(null);

    const updateLockHintPosition = useCallback(
        (event) => {
            if (!isActive) return;

            const VIEWPORT_MARGIN = 12;
            const NORTH_OFFSET_Y = 14;
            const hintWidth = lockHintRef.current?.offsetWidth ?? 340;
            const hintHeight = lockHintRef.current?.offsetHeight ?? 70;

            const anchorX = event.clientX;
            const anchorY = event.clientY + NORTH_OFFSET_Y;

            const rawLeft = anchorX - hintWidth / 2;
            const rawTop = anchorY;

            const maxLeft = Math.max(
                VIEWPORT_MARGIN,
                window.innerWidth - hintWidth - VIEWPORT_MARGIN,
            );
            const maxTop = Math.max(
                VIEWPORT_MARGIN,
                window.innerHeight - hintHeight - VIEWPORT_MARGIN,
            );

            const nextX = Math.min(Math.max(VIEWPORT_MARGIN, rawLeft), maxLeft);
            const nextY = Math.min(Math.max(VIEWPORT_MARGIN, rawTop), maxTop);

            setLockHintPosition({
                x: nextX,
                y: nextY,
            });
            setIsLockHintVisible(true);
        },
        [isActive],
    );

    const hideLockHint = useCallback(() => {
        setIsLockHintVisible(false);
    }, []);

    return {
        isLockHintVisible,
        lockHintPosition,
        lockHintRef,
        updateLockHintPosition,
        hideLockHint,
    };
}
