import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSpeedHandler } from "../hooks/useSpeedHandler.js";
import PlayIcon from "./PlayIcon.jsx";
import PauseIcon from "./PauseIcon.jsx";
import {
    HOURS_IN_DAY,
    BASE_FRAME_MS,
    MINUTES_IN_HOUR,
    MINUTES_IN_DAY,
    MAX_MINUTE_INDEX,
    TIME_DRAG_THRESHOLD_PX,
    SPEED_OPTIONS,
    clamp,
    normalizeTime,
    formatTimeLabel,
    formatSpeedLabel,
    createHourMarks,
} from "../utils/speedController.js";

export { HOURS_IN_DAY };

/**
 * Circular draggable time wheel used to scrub the map time frame. The wheel
 * wraps seamlessly past midnight in both directions: the tick strip is
 * periodic, so 23:59 -> 00:00 is just another step. Playback speed is chosen
 * from the discrete SPEED_OPTIONS steps.
 * @param {Function} setCurrentTime - Function to update the current time in the parent component.
 * @param {number} currentTime - The current time in hours (can be a fractional value representing minutes).
 * @param {boolean} [disabled=false] - When true, all pointer/keyboard interaction is suppressed.
 * @returns {JSX.Element} The scrubbable time wheel + speed step controls.
 */
export default function SpeedController({ setCurrentTime, currentTime, disabled = false }) {
    const trackRef = useRef(null);
    const activePointerIdRef = useRef(null);
    const dragStartXRef = useRef(0);
    const dragStartMinuteIndexRef = useRef(0);
    const dragTrackWidthRef = useRef(0);
    const hasDraggedRef = useRef(false);
    const [isDragging, setIsDragging] = useState(false);
    const {
        isPlaying,
        setIsPlaying,
        setSpeed,
        speed,
    } = useSpeedHandler({
        setCurrentTime,
        currentTime,
        hoursInDay: HOURS_IN_DAY,
        baseFrameMs: BASE_FRAME_MS,
    });

    useEffect(() => {
        if (disabled) {
            setIsPlaying(false);
        }
    }, [disabled, setIsPlaying]);

    const hourMarks = useMemo(() => createHourMarks(), []);
    const currentTimeLabel = useMemo(() => formatTimeLabel(currentTime), [currentTime]);
    const currentMinuteIndex = useMemo(() => {
        const normalizedTime = normalizeTime(currentTime);
        return clamp(Math.floor(normalizedTime * MINUTES_IN_HOUR), 0, MAX_MINUTE_INDEX);
    }, [currentTime]);

    // One day of minutes spans one period (100%) of the periodic tick strip
    const currentPosition = (currentMinuteIndex / MINUTES_IN_DAY) * 100;
    const stripTransform = `translateX(calc(50% - ${currentPosition}%))`;
    const isInteractionDisabled = disabled;

    const stopDragging = useCallback(() => {
        const track = trackRef.current;
        if (track != null && activePointerIdRef.current != null && track.hasPointerCapture(activePointerIdRef.current)) {
            track.releasePointerCapture(activePointerIdRef.current);
        }
        activePointerIdRef.current = null;
        dragStartXRef.current = 0;
        dragStartMinuteIndexRef.current = 0;
        dragTrackWidthRef.current = 0;
        setIsDragging(false);
        hasDraggedRef.current = false;
    }, []);

    const handlePointerDown = (event) => {
        if (isInteractionDisabled) {
            return;
        }

        if (event.button !== 0) {
            return;
        }

        event.preventDefault();

        const track = trackRef.current;
        if (track == null) {
            return;
        }

        activePointerIdRef.current = event.pointerId;
        track.setPointerCapture(event.pointerId);
        setIsDragging(true);
        dragStartXRef.current = event.clientX;
        dragStartMinuteIndexRef.current = currentMinuteIndex;
        dragTrackWidthRef.current = track.getBoundingClientRect().width;
        hasDraggedRef.current = false;
    };

    const handlePointerMove = (event) => {
        if (isInteractionDisabled) {
            return;
        }

        if (!isDragging || activePointerIdRef.current !== event.pointerId) {
            return;
        }

        if (!hasDraggedRef.current) {
            const dragDelta = Math.abs(event.clientX - dragStartXRef.current);
            if (dragDelta < TIME_DRAG_THRESHOLD_PX) {
                return;
            }
            hasDraggedRef.current = true;
        }

        event.preventDefault();
        const trackWidth = dragTrackWidthRef.current;
        if (trackWidth <= 0) {
            return;
        }

        // The visible rail spans one full day, so a drag across the whole
        // track is 24 hours. No clamping: the wheel is circular and wraps.
        const deltaX = event.clientX - dragStartXRef.current;
        const minuteDelta = (deltaX / trackWidth) * MINUTES_IN_DAY;
        const nextMinuteIndex = dragStartMinuteIndexRef.current - minuteDelta;
        setCurrentTime(normalizeTime(nextMinuteIndex / MINUTES_IN_HOUR));
    };

    const handlePointerUp = (event) => {
        if (isInteractionDisabled) {
            return;
        }

        if (activePointerIdRef.current !== event.pointerId) {
            return;
        }
        stopDragging();
    };

    const handlePointerCancel = (event) => {
        if (isInteractionDisabled) {
            return;
        }

        if (activePointerIdRef.current !== event.pointerId) {
            return;
        }
        stopDragging();
    };

    const stepSpeed = useCallback(
        (direction) => {
            const currentIndex = SPEED_OPTIONS.indexOf(speed);
            const safeIndex = currentIndex === -1 ? SPEED_OPTIONS.indexOf(1) : currentIndex;
            const nextIndex = clamp(safeIndex + direction, 0, SPEED_OPTIONS.length - 1);
            setSpeed(SPEED_OPTIONS[nextIndex]);
        },
        [speed, setSpeed],
    );

    const handleSpeedKeyDown = (event) => {
        if (isInteractionDisabled) {
            return;
        }

        const stepMap = {
            ArrowLeft: -1,
            ArrowDown: -1,
            ArrowRight: 1,
            ArrowUp: 1,
        };

        if (event.key === "Home") {
            event.preventDefault();
            setSpeed(SPEED_OPTIONS[0]);
            return;
        }

        if (event.key === "End") {
            event.preventDefault();
            setSpeed(SPEED_OPTIONS[SPEED_OPTIONS.length - 1]);
            return;
        }

        if (!(event.key in stepMap)) {
            return;
        }

        event.preventDefault();
        stepSpeed(stepMap[event.key]);
    };

    const handleKeyDown = (event) => {
        if (isInteractionDisabled) {
            return;
        }

        const stepMap = {
            ArrowLeft: 1,
            ArrowDown: 1,
            ArrowRight: -1,
            ArrowUp: -1,
            PageDown: 15,
            PageUp: -15,
        };

        if (event.key === "Home") {
            event.preventDefault();
            setCurrentTime(0);
            return;
        }

        if (event.key === "End") {
            event.preventDefault();
            setCurrentTime(MAX_MINUTE_INDEX / MINUTES_IN_HOUR);
            return;
        }

        if (!(event.key in stepMap)) {
            return;
        }

        event.preventDefault();
        // Wraps around midnight instead of clamping: the wheel is circular
        const nextMinuteIndex = currentMinuteIndex + stepMap[event.key];
        setCurrentTime(normalizeTime(nextMinuteIndex / MINUTES_IN_HOUR));
    };

    return (
        <div className={`map-speed-controls${disabled ? " is-disabled" : ""}`}>
            <div className="map-speed-controls__header">
                <div className="map-speed-controls__meta">
                    <span className="map-speed-clock">{currentTimeLabel}</span>
                    <span className="map-speed-controls__eyebrow">Time wheel</span>
                </div>
                <p className="map-speed-controls__hint">Drag the wheel to scrub the day in minute increments. It wraps past midnight.</p>
            </div>
            <div className="map-time-wheel-layout">
                <button
                    type="button"
                    className={`map-speed-controls__play-btn${isPlaying ? " is-playing" : ""}`}
                    aria-label={isPlaying ? "Pause animation" : "Play animation"}
                    aria-pressed={isPlaying}
                    aria-disabled={disabled}
                    disabled={disabled}
                    onClick={() => setIsPlaying((prev) => !prev)}
                >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>

                <div
                    ref={trackRef}
                    className={`map-time-wheel${isDragging ? " is-dragging" : ""}${disabled ? " is-disabled" : ""}`}
                    role="slider"
                    tabIndex={disabled ? -1 : 0}
                    aria-label="Map time wheel"
                    aria-disabled={disabled}
                    aria-valuemin={0}
                    aria-valuemax={MAX_MINUTE_INDEX}
                    aria-valuenow={currentMinuteIndex}
                    aria-valuetext={currentTimeLabel}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerCancel}
                    onKeyDown={handleKeyDown}
                >
                    <div className="map-time-wheel__rail" aria-hidden="true">
                        <div
                            className="map-time-wheel__moving-strip"
                            style={{ transform: stripTransform }}
                        >
                            <div className="map-time-wheel__ticks">
                                {hourMarks.map((mark) => (
                                    <span
                                        key={mark.hour}
                                        className={[
                                            "map-time-wheel__tick",
                                            mark.isMinor ? "map-time-wheel__tick--minor" : "",
                                            mark.isMajor ? "map-time-wheel__tick--major" : "",
                                        ].filter(Boolean).join(" ")}
                                        style={{ left: `${mark.position}%` }}
                                    >
                                        <span className="map-time-wheel__tick-line" />
                                        <span className="map-time-wheel__tick-label">{mark.label}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <span className="map-time-wheel__pre-indicator-overlay" />
                        <span className="map-time-wheel__center-indicator" />
                    </div>
                </div>

                <div
                    className={`map-speed-controls__speed-selector${disabled ? " is-disabled" : ""}`}
                    role="group"
                    aria-label="Playback speed"
                    aria-disabled={disabled}
                    onKeyDown={handleSpeedKeyDown}
                >
                    <div className="map-speed-controls__speed-summary">
                        <span className="map-speed-controls__speed-value">{formatSpeedLabel(speed)}</span>
                    </div>

                    <div className="map-speed-controls__speed-wheel" aria-hidden={disabled}>
                        <div className="map-speed-controls__speed-wheel-rail">
                            {SPEED_OPTIONS.map((option) => (
                                <button
                                    type="button"
                                    key={option}
                                    className={`map-speed-controls__speed-step${speed === option ? " is-active" : ""}`}
                                    aria-pressed={speed === option}
                                    disabled={disabled}
                                    onClick={() => setSpeed(option)}
                                >
                                    {formatSpeedLabel(option)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
