import {
    HEALTHY_RGB,
    DANGER_RGB,
    UNKNOWN_RGB,
    ACCENT_RGB,
} from '@/utils/editorialTokens.js'
import { HEALTH_CATEGORY } from './stationAvailabilitySelector.js'
import { createStationDotsLayers } from './stationDotsLayer.js'

// Radius in pixels: constant across zoom so dots never overlap when zooming in.
const STATION_RADIUS = 6

/**
 * Builds the infrastructure station dot layers via the shared station-dot
 * factory: uniform outlined dots colored by health category, the shared warm
 * selection halo for picked stations, and an invisible enlarged hit layer.
 * @param {Array} stations - Station objects with latitude, longitude, and health_category.
 * @param {Array} selectedStationIds - Selected station ids, get the halo ring.
 * @param {string|null} hoveredStationId - Hovered station id, enlarged.
 * @param {Function} onStationPick - Click handler toggling station selection.
 * @param {Function} onStationHover - Hover handler.
 * @returns {Array} The infrastructure station deck.gl layers.
 */
export function createStationAvailabilityLayer({
    stations,
    selectedStationIds = [],
    hoveredStationId = null,
    onStationPick,
    onStationHover,
}) {
    return createStationDotsLayers({
        id: 'station-availability-layer',
        stations,
        getColor: (d) => getStationColor(d.health_category),
        selectedStationIds,
        hoveredStationId,
        baseRadius: STATION_RADIUS,
        withHitLayer: true,
        onPick: onStationPick,
        onHover: onStationHover,
    })
}

export const HEALTH_CATEGORY_LABELS = {
    [HEALTH_CATEGORY.HEALTHY]: 'Healthy',
    [HEALTH_CATEGORY.EMPTY_RISK]: 'Empty risk',
    [HEALTH_CATEGORY.FULL_RISK]: 'Full risk',
    [HEALTH_CATEGORY.UNKNOWN]: 'Offline',
}

// Empty risk is red (the rider-facing "nothing to rent" failure); full risk is
// blue to stay distinct from the orange selection highlight.
const HEALTH_CATEGORY_COLORS = {
    [HEALTH_CATEGORY.HEALTHY]: HEALTHY_RGB,
    [HEALTH_CATEGORY.EMPTY_RISK]: DANGER_RGB,
    [HEALTH_CATEGORY.FULL_RISK]: ACCENT_RGB,
    [HEALTH_CATEGORY.UNKNOWN]: UNKNOWN_RGB,
}

/**
 * Resolves the RGB color of a station health category.
 * @param {string} category - Health category key.
 * @returns {number[]} RGB triple, grey for unknown categories.
 */
function getStationColor(category) {
    return HEALTH_CATEGORY_COLORS[category] ?? UNKNOWN_RGB
}


/**
 * Generates tooltip content for a station availability point. Hover shows
 * only the station name; clicking the station opens the sidebar with the
 * full availability details.
 * @param {Object} object - The station data object.
 * @returns {string} The station name.
 */
export function stationAvailabilityTooltip(object) {
    return object?.name ?? 'Unknown Station'
}

/**
 * Returns the legend entries for the station availability layer as plain data.
 * `MapLegend` renders them uniformly alongside every other layer's entries.
 * When `showBikeRoutes` is true the legend also surfaces the bike-routes section.
 */
export function stationAvailabilityLegend({ showBikeRoutes = false } = {}) {
    return {
        entries: [
            { key: HEALTH_CATEGORY.HEALTHY, swatch: 'rgb(47, 125, 79)', label: 'Healthy', hint: 'bikes and docks available' },
            { key: HEALTH_CATEGORY.EMPTY_RISK, swatch: 'rgb(163, 45, 45)', label: 'Empty risk', hint: 'few or no bikes to rent' },
            { key: HEALTH_CATEGORY.FULL_RISK, swatch: 'rgb(25, 83, 216)', label: 'Full risk', hint: 'few or no docks to return' },
            { key: HEALTH_CATEGORY.UNKNOWN, swatch: 'rgb(110, 106, 98)', label: 'Offline', hint: 'no live data' },
        ],
        includeBikeRoutes: showBikeRoutes,
    }
}
