import { ScatterplotLayer } from '@deck.gl/layers'
import {
    HEALTHY_RGB,
    DANGER_RGB,
    UNKNOWN_RGB,
    ACCENT_RGB,
} from '@/utils/editorialTokens.js'
import { formatCount } from '@/utils/numberFormat.js'
import { HEALTH_CATEGORY } from './stationAvailabilitySelector.js'

/**
 * Creates a scatterplot layer for displaying station availability information.
 * @param {Array} stations - An array of station objects, each containing:
 *   - latitude: number
 *   - longitude: number
 *   - capacity: number (total docks)
 *   - health_category: string (HEALTH_CATEGORY value)
 * @returns
 */
export function createStationAvailabilityLayer({ stations, selectedStationIds = [], onStationPick }) {
    const selectedIds = new Set(selectedStationIds)
    return new ScatterplotLayer({
        id: 'station-availability-layer',
        data: stations,
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: (d) => Math.sqrt(d.capacity) * 8, // larger stations appear bigger
        getFillColor: (d) => selectedIds.has(d.id) ? [249, 115, 22, 240] : getStationColor(d.health_category),
        getLineColor: (d) => selectedIds.has(d.id) ? [255, 255, 255] : [255, 255, 255],
        getLineWidth: (d) => selectedIds.has(d.id) ? 3 : 1,
        lineWidthMinPixels: 1,
        stroked: true,
        filled: true,
        radiusMinPixels: 4,
        radiusMaxPixels: 30,
        pickable: true,
        onClick: onStationPick,
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


/** * Generates tooltip content for a station availability point.
 * @param {Object} object - The station data object
 * @returns {string} A formatted string with station information for the tooltip.
 */
export function stationAvailabilityTooltip( object ) {
    return `${object.name}\n
            Status: ${HEALTH_CATEGORY_LABELS[object.health_category] ?? 'Offline'}
            Available Classical Bikes: ${formatCount(object.classicalBikes)}
            Available Electric Bikes: ${formatCount(object.electricBikes)}
            Available Docks: ${formatCount(object.available_docks)}
            Total Capacity: ${formatCount(object.capacity)}`
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
