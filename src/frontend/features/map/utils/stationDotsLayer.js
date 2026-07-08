import { ScatterplotLayer } from '@deck.gl/layers'
import { WHITE_RGB, WARM_HIGHLIGHT_RGB } from '@/utils/editorialTokens.js'

const HOVER_RADIUS_MULTIPLIER = 1.7
const RADIUS_MAX_METERS = 160

// Selection halo: a warm ring under the dot, large enough to read at any zoom
// while the dot itself keeps its caller palette (health color, flow color).
const HALO_RADIUS_MULTIPLIER = 2.2
const HALO_FILL_ALPHA = 70
const HALO_MIN_PIXELS_MULTIPLIER = 2.5

const PICK_RADIUS_MULTIPLIER = 3.5
const PICK_RADIUS_MAX_METERS = 160
const PICK_MIN_PIXELS = 15
const PICK_MAX_PIXELS = 140

/**
 * Computes a station dot's visual radius in meters, enlarging the hovered one.
 * @param {Object} d - Station datum.
 * @param {string|null} hoveredStationId - Currently hovered station id.
 * @param {number} baseRadius - Base radius in meters.
 * @returns {number} Radius in meters.
 */
function getVisualRadius(d, hoveredStationId, baseRadius) {
    if (d.id !== hoveredStationId) return baseRadius
    return Math.min(baseRadius * HOVER_RADIUS_MULTIPLIER, RADIUS_MAX_METERS)
}

/**
 * Builds the shared station-dot layer stack used by both the trip flow and
 * infrastructure layers: an optional selection halo underneath, the visible
 * outlined dots, and an optional invisible enlarged hit layer carrying the
 * pick handlers. Layer ids derive from `id` (`${id}-selection-halo`,
 * `${id}-hit`) so `POINT_LAYER_ID_PREFIXES` and the `startsWith` checks in
 * `useMapClickActions` keep matching by prefix.
 * @param {string} id - Base layer id (also the visible dots layer id).
 * @param {Array} stations - Station data with id, latitude, and longitude.
 * @param {Function} getColor - Fill color accessor, caller palette (RGB or RGBA).
 * @param {Array} selectedStationIds - Station ids that receive the halo ring.
 * @param {string|null} hoveredStationId - Hovered station id, enlarged.
 * @param {number} baseRadius - Dot radius in meters, zoom-adaptive.
 * @param {number} minPixels - Pixel floor keeping dots readable when zoomed out.
 * @param {number} maxPixels - Pixel ceiling when zoomed in.
 * @param {boolean} withHitLayer - Add the invisible enlarged pick layer.
 * @param {Function} onPick - Click handler, attached to the hit layer.
 * @param {Function} onHover - Hover handler, attached to the hit layer.
 * @param {Array} colorUpdateTriggers - Extra caller triggers for the fill color.
 * @returns {Array} Deck.gl layers in render order: [halo?, dots, hit?].
 */
export function createStationDotsLayers({
    id,
    stations,
    getColor,
    selectedStationIds = [],
    hoveredStationId = null,
    baseRadius = 24,
    minPixels = 5,
    maxPixels = 60,
    withHitLayer = false,
    onPick,
    onHover,
    colorUpdateTriggers = [],
}) {
    const selectedIds = new Set(selectedStationIds)
    // Stable trigger key so selection changes rebuild colors exactly once
    const selectionKey = [...selectedStationIds].sort().join('|')
    const layers = []

    if (selectedIds.size > 0) {
        const selectedStations = stations.filter((d) => selectedIds.has(d.id))
        layers.push(new ScatterplotLayer({
            id: `${id}-selection-halo`,
            data: selectedStations,
            getPosition: (d) => [d.longitude, d.latitude],
            getRadius: baseRadius * HALO_RADIUS_MULTIPLIER,
            getFillColor: [...WARM_HIGHLIGHT_RGB, HALO_FILL_ALPHA],
            getLineColor: [...WARM_HIGHLIGHT_RGB, 255],
            lineWidthMinPixels: 2.5,
            stroked: true,
            filled: true,
            radiusUnits: 'meters',
            radiusMinPixels: minPixels * HALO_MIN_PIXELS_MULTIPLIER,
            radiusMaxPixels: maxPixels * HALO_RADIUS_MULTIPLIER,
            pickable: false,
            parameters: { depthTest: false },
        }))
    }

    layers.push(new ScatterplotLayer({
        id,
        data: stations,
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: (d) => getVisualRadius(d, hoveredStationId, baseRadius),
        getFillColor: getColor,
        getLineColor: WHITE_RGB,
        lineWidthMinPixels: 1.5,
        stroked: true,
        filled: true,
        radiusUnits: 'meters',
        radiusMinPixels: minPixels,
        radiusMaxPixels: maxPixels,
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
            getFillColor: [hoveredStationId, selectionKey, ...colorUpdateTriggers],
            getRadius: [hoveredStationId],
        },
    }))

    if (withHitLayer) {
        layers.push(new ScatterplotLayer({
            id: `${id}-hit`,
            data: stations,
            getPosition: (d) => [d.longitude, d.latitude],
            getRadius: (d) => {
                const visualRadius = getVisualRadius(d, hoveredStationId, baseRadius)
                return Math.min(visualRadius * PICK_RADIUS_MULTIPLIER, PICK_RADIUS_MAX_METERS)
            },
            getFillColor: [0, 0, 0, 0],
            stroked: false,
            filled: true,
            radiusUnits: 'meters',
            radiusMinPixels: PICK_MIN_PIXELS,
            radiusMaxPixels: PICK_MAX_PIXELS,
            pickable: true,
            onClick: onPick,
            onHover,
            updateTriggers: {
                getRadius: [hoveredStationId],
            },
            parameters: { depthTest: false },
        }))
    }

    return layers
}
