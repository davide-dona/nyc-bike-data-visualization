import PlayIcon from "../../components/PlayIcon.jsx";
import PauseIcon from "../../components/PauseIcon.jsx";
import useTimeWheel from "../hooks/useTimeWheel.js";
import {
    MAX_MINUTE_INDEX,
    SPEED_OPTIONS,
    formatSpeedLabel,
} from "../utils/speedController.js";

/**
 * Circular draggable time wheel for scrubbing the map time frame; wraps
 * seamlessly past midnight. Interaction logic lives in useTimeWheel.
 * @param {Function} setCurrentTime - Updates the current time.
 * @param {number} currentTime - Current time in hours (fractional for minutes).
 * @param {boolean} [disabled=false] - Suppresses all interaction when true.
 * @returns {JSX.Element} The time wheel and speed controls.
 */
export default function SpeedController({ setCurrentTime, currentTime, disabled = false }) {
    const {
        trackRef,
        isDragging,
        isPlaying,
        setIsPlaying,
        speed,
        setSpeed,
        hourMarks,
        currentTimeLabel,
        currentMinuteIndex,
        stripTransform,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
        handleKeyDown,
        handleSpeedKeyDown,
    } = useTimeWheel({ setCurrentTime, currentTime, disabled });

    return (
        <div className={`map-speed-controls${disabled ? " is-disabled" : ""}`}>
            <div className="map-speed-controls__header">
                <div className="map-speed-controls__meta">
                    <span className="map-speed-clock">{currentTimeLabel}</span>
                    <span className="map-speed-controls__eyebrow">Time wheel</span>
                </div>
                <p className="map-speed-controls__hint">Drag the wheel to adjust the time minute-by-minute, looping past midnight.</p>
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
