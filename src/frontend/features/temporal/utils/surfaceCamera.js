// Camera math for the 3D surface graph: the camera orbits the plot at a
// fixed radius and height, constrained to a half turn, and the UI exposes
// the azimuth as a -90..90 degree display angle centered on the default view.

export const INITIAL_CAMERA = {
    eye: { x: 1.6, y: -1.6, z: 0.9 },
    center: { x: 0, y: 0, z: -0.3 },
    up: { x: 0, y: 0, z: 1 },
    projection: { type: "perspective" },
}

const BASE_RADIUS_XY = Math.hypot(INITIAL_CAMERA.eye.x, INITIAL_CAMERA.eye.y)
const BASE_EYE_Z = INITIAL_CAMERA.eye.z
export const AZIMUTH_PER_PIXEL = 0.01
const DEG_TO_RAD = Math.PI / 180
const MIN_ANGLE_DEG = -180
const MAX_ANGLE_DEG = 0
export const DISPLAY_MIN_DEG = -90
export const DISPLAY_MAX_DEG = 90
const MIN_ANGLE = MIN_ANGLE_DEG * DEG_TO_RAD
const MAX_ANGLE = MAX_ANGLE_DEG * DEG_TO_RAD
const DEFAULT_AZIMUTH = Math.atan2(INITIAL_CAMERA.eye.y, INITIAL_CAMERA.eye.x)
export const INITIAL_AZIMUTH = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, DEFAULT_AZIMUTH))

/**
 * Clamps an azimuth (radians) into the allowed half-turn orbit range.
 * @param {number} value - Azimuth in radians.
 * @returns {number} Clamped azimuth.
 */
export function clampAzimuth(value) {
    return Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, value))
}

/**
 * Builds the Plotly camera for an azimuth, orbiting at the initial radius
 * and eye height.
 * @param {number} azimuth - Azimuth in radians.
 * @returns {Object} Plotly scene.camera config.
 */
export function buildCameraFromAzimuth(azimuth) {
    return {
        ...INITIAL_CAMERA,
        eye: {
            x: BASE_RADIUS_XY * Math.cos(azimuth),
            y: BASE_RADIUS_XY * Math.sin(azimuth),
            z: BASE_EYE_Z,
        },
    }
}

/**
 * Clamps a display angle (degrees) into the -90..90 slider range.
 * @param {number} value - Display angle in degrees.
 * @returns {number} Clamped display angle.
 */
export function clampDisplayAngle(value) {
    return Math.max(DISPLAY_MIN_DEG, Math.min(DISPLAY_MAX_DEG, value))
}

/**
 * Converts an azimuth to its user-facing display angle.
 * @param {number} azimuth - Azimuth in radians.
 * @returns {number} Display angle in degrees, clamped to the slider range.
 */
export function azimuthToDisplayAngle(azimuth) {
    const azimuthDeg = azimuth / DEG_TO_RAD
    return clampDisplayAngle(azimuthDeg + 90)
}

/**
 * Converts a display angle back to a clamped azimuth.
 * @param {number} displayAngle - Display angle in degrees.
 * @returns {number} Azimuth in radians, clamped to the orbit range.
 */
export function displayAngleToAzimuth(displayAngle) {
    return clampAzimuth((displayAngle - 90) * DEG_TO_RAD)
}
