import { INK_MUTED_RGB, WARM_HIGHLIGHT_RGB } from "@/utils/editorialTokens.js";
import { createStationDotsLayers } from "./stationDotsLayer.js";

// Overview dots recede behind the corridor web: smaller, semi-transparent.
const STATION_COLOR_OVERVIEW = [...INK_MUTED_RGB, 170];

// Radii in pixels: constant across zoom so dots never overlap when zooming in.
const STATION_RADIUS_FOCUS = 6;
const STATION_RADIUS_OVERVIEW = 4;

/**
 * Builds the trip-flow station dot layers via the shared station-dot factory:
 * outlined dots plus an invisible enlarged hit layer. In the citywide overview
 * the dots recede (smaller, semi-transparent) so the corridor web stays the
 * hero; in focus view they regain full weight and the focused station carries
 * the shared warm selection halo.
 * @param {Array} stations - Clickable stations with coordinates.
 * @param {string|null} focusedStationId - Focused station id, gets the halo.
 * @param {string|null} hoveredStationId - Hovered station id, enlarged.
 * @param {boolean} isFocusView - Whether a station is focused.
 * @param {Function} onStationPick - Pick handler focusing a station.
 * @param {Function} onStationHover - Hover handler.
 * @returns {Array} The trip-flow station deck.gl layers.
 */
export function createTripStationsLayers({
    stations,
    focusedStationId = null,
    hoveredStationId = null,
    isFocusView = false,
    onStationPick,
    onStationHover,
}) {
    return createStationDotsLayers({
        id: "trip-flow-stations-layer",
        stations,
        getColor: (d) => {
            if (d.id === hoveredStationId) return WARM_HIGHLIGHT_RGB;
            return isFocusView ? INK_MUTED_RGB : STATION_COLOR_OVERVIEW;
        },
        selectedStationIds: focusedStationId ? [focusedStationId] : [],
        hoveredStationId,
        baseRadius: isFocusView ? STATION_RADIUS_FOCUS : STATION_RADIUS_OVERVIEW,
        withHitLayer: true,
        onPick: onStationPick,
        onHover: onStationHover,
        colorUpdateTriggers: [isFocusView],
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
