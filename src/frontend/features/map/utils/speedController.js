export const HOURS_IN_DAY = 24;
export const BASE_FRAME_MS = 1000;
export const MINUTES_IN_HOUR = 60;
export const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_IN_HOUR;
export const MAX_MINUTE_INDEX = MINUTES_IN_DAY - 1;
export const TIME_DRAG_THRESHOLD_PX = 4;

/** Discrete playback speeds offered by the selector, in multiplier units. */
export const SPEED_OPTIONS = [0.5, 1, 2, 4];

export { clamp } from '@/utils/math.js';

/**
 * Normalizes a time value to [0, HOURS_IN_DAY), wrapping negative or large
 * values back into the valid day range.
 * @param {number} time - Time in hours (may be fractional).
 * @returns {number} Normalized time in [0, HOURS_IN_DAY).
 */
export const normalizeTime = (time) => ((time % HOURS_IN_DAY) + HOURS_IN_DAY) % HOURS_IN_DAY;

/**
 * Formats a fractional-hour time as a HH:MM string.
 * @param {number} time - Time in hours (may be fractional).
 * @returns {string} Zero-padded HH:MM label.
 */
export const formatTimeLabel = (time) => {
    const normalizedTime = normalizeTime(time);
    const totalMinutes = Math.floor(normalizedTime * MINUTES_IN_HOUR);
    const hours = Math.floor(totalMinutes / MINUTES_IN_HOUR);
    const minutes = totalMinutes % MINUTES_IN_HOUR;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

/**
 * Formats a playback speed multiplier as a compact label (e.g. "2×", "0.5×").
 * @param {number} value - Speed multiplier.
 * @returns {string} Display string with trailing "×".
 */
export const formatSpeedLabel = (value) => {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}×` : `${rounded.toFixed(1)}×`;
};

/**
 * Produces the hour tick marks for the circular time wheel. The strip is
 * periodic: three day-widths of ticks (hours -24..48) so that the window
 * centered on any normalized time is always fully covered, and a wrap from
 * 23:59 to 00:00 translates the strip by exactly one period - visually
 * seamless. Ticks carry importance flags so responsive decimation can key on
 * the hour itself instead of DOM order.
 * @returns {Array<{hour:number,label:string,position:number,isMinor:boolean,isMajor:boolean}>}
 */
export const createHourMarks = () =>
    Array.from({ length: 3 * HOURS_IN_DAY + 1 }, (_, index) => {
        const hour = index - HOURS_IN_DAY;
        const normalizedHour = ((hour % HOURS_IN_DAY) + HOURS_IN_DAY) % HOURS_IN_DAY;
        return {
            hour,
            label: String(normalizedHour).padStart(2, "0"),
            position: (hour / HOURS_IN_DAY) * 100,
            isMinor: normalizedHour % 2 === 1,
            isMajor: normalizedHour % 6 === 0,
        };
    });
