import { ScatterplotLayer } from "@deck.gl/layers";
import {
    INK_MUTED_RGB,
    WARM_HIGHLIGHT_RGB,
} from "@/utils/editorialTokens.js";

const STATION_COLOR_DEFAULT = INK_MUTED_RGB;
const STATION_COLOR_SELECTED = WARM_HIGHLIGHT_RGB;
// Overview dots recede behind the corridor web: smaller, semi-transparent.
const STATION_COLOR_OVERVIEW = [...INK_MUTED_RGB, 150];

const STATION_RADIUS_BASE = 24;
const STATION_RADIUS_BASE_OVERVIEW = 14;
const STATION_RADIUS_HOVER_MULTIPLIER = 2;
const STATION_RADIUS_MAX = 160;

const STATION_PICK_RADIUS_MULTIPLIER = 3.5;
const STATION_PICK_RADIUS_MAX = 160;

/**
 * Computes a station dot's visual radius, enlarging the hovered station.
 * @param {Object} d - Station datum.
 * @param {string|null} hoveredStationId - Currently hovered station id.
 * @param {boolean} isFocusView - Whether a station is focused (overview dots are smaller).
 * @returns {number} Radius in meters.
 */
function getVisualRadius(d, hoveredStationId, isFocusView = true) {
    const base = isFocusView ? STATION_RADIUS_BASE : STATION_RADIUS_BASE_OVERVIEW;
    if (d.id !== hoveredStationId) return base;
    return Math.min(base * STATION_RADIUS_HOVER_MULTIPLIER, STATION_RADIUS_MAX);
}

/**
 * Builds the visible trip-flow station dots layer. In the citywide overview
 * the dots recede (smaller, semi-transparent) so the corridor web stays the
 * hero; in focus view they regain full weight as click targets.
 * @param {Array} stations - Clickable stations with coordinates.
 * @param {string|null} focusedStationId - Focused station id, dims the rest.
 * @param {string|null} hoveredStationId - Hovered station id, enlarged.
 * @param {boolean} isFocusView - Whether a station is focused.
 * @returns {ScatterplotLayer} The deck.gl layer.
 */
export function createTripStationsLayer({
    stations,
    focusedStationId = null,
    hoveredStationId = null,
    isFocusView = false,
}) {
    return new ScatterplotLayer({
        id: "trip-flow-stations-layer",
        data: stations,
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: (d) => getVisualRadius(d, hoveredStationId, isFocusView),
        getFillColor: (d) => {
            if (d.id === focusedStationId || d.id === hoveredStationId) return STATION_COLOR_SELECTED;
            return isFocusView ? STATION_COLOR_DEFAULT : STATION_COLOR_OVERVIEW;
        },
        getLineColor: [255, 255, 255],
        lineWidthMinPixels: 1,
        stroked: true,
        filled: true,
        radiusUnits: "meters",
        radiusMinPixels: isFocusView ? 4 : 2.5,
        radiusMaxPixels: 110,
        pickable: false,
        transitions: {
            getRadius: {
                duration: 220,
                easing: (t) => t * t * (3 - 2 * t),
            },
            getFillColor: {
                duration: 180,
            },
        },

        updateTriggers: {
            getFillColor: [focusedStationId, hoveredStationId, isFocusView],
            getRadius: [hoveredStationId, isFocusView],
        },
    });
}

/**
 * Builds the invisible, larger hit-target layer that makes station dots easy
 * to hover and click.
 * @param {Array} stations - Clickable stations with coordinates.
 * @param {string|null} hoveredStationId - Hovered station id (keeps picks in sync).
 * @param {Function} onStationPick - Pick handler focusing a station.
 * @param {Function} onStationHover - Hover handler.
 * @returns {ScatterplotLayer} The deck.gl hit layer.
 */
export function createTripStationsHitLayer({
    stations,
    hoveredStationId = null,
    onStationPick,
    onStationHover,
}) {
    return new ScatterplotLayer({
        id: "trip-flow-stations-layer-hit",
        data: stations,
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: (d) => {
            const visualRadius = getVisualRadius(d, hoveredStationId);
            return Math.min(
                visualRadius * STATION_PICK_RADIUS_MULTIPLIER, STATION_PICK_RADIUS_MAX,
            );
        },
        getFillColor: [0, 0, 0, 0],
        stroked: false,
        filled: true,
        radiusUnits: "meters",
        radiusMinPixels: 15,
        radiusMaxPixels: 140,
        pickable: true,
        onClick: onStationPick,
        onHover: onStationHover,
        updateTriggers: {
            getRadius: [hoveredStationId],
        },
        parameters: {
            depthTest: false,
        },
    });
}

/**
 * Tooltip text for a trip-flow station dot.
 * @param {Object} object - Picked station datum.
 * @returns {string} The station name.
 */
export function tripStationTooltip(object) {
    return object?.name ?? "Unknown Station";
}
