import { INK_MUTED_RGB, WARM_HIGHLIGHT_RGB } from "@/utils/editorialTokens.js";
import { createStationDotsLayers } from "../../utils/stationDotsLayer.js";

// Overview dots recede behind the corridor web: smaller, semi-transparent.
const STATION_COLOR_OVERVIEW = [...INK_MUTED_RGB, 170];

// Geographic radii (meters) with pixel caps: dots shrink with the map when zoomed out,
// then hold the capped size once zoomed in. Overview dots stay small so the corridor web reads first.
const STATION_RADIUS_FOCUS_M = 70;
const STATION_RADIUS_OVERVIEW_M = 40;
const STATION_MAX_PIXELS_FOCUS = 5;
const STATION_MAX_PIXELS_OVERVIEW = 3.5;

/**
 * Builds the trip-flow station dot layers via the shared station-dot factory. In the overview
 * dots recede (smaller, semi-transparent); in focus view they regain full weight and the
 * focused station carries the shared warm selection halo.
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
        baseRadius: isFocusView ? STATION_RADIUS_FOCUS_M : STATION_RADIUS_OVERVIEW_M,
        maxRadiusPixels: isFocusView ? STATION_MAX_PIXELS_FOCUS : STATION_MAX_PIXELS_OVERVIEW,
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
