import { ScatterplotLayer } from '@deck.gl/layers'
import { WHITE_RGB, WARM_HIGHLIGHT_RGB } from '@/utils/editorialTokens.js'

// Kept low so dots keep shrinking with the map instead of snapping to a fixed minimum and overlapping at citywide zoom.
const MIN_RADIUS_PIXELS = 0.75

const HOVER_RADIUS_MULTIPLIER = 1.7

// Selection halo: a warm ring under the dot, with its own pixel floor so it stays readable at citywide zoom.
const HALO_RADIUS_MULTIPLIER = 2.2
const HALO_FILL_ALPHA = 70
const HALO_MIN_RADIUS_PIXELS = 3

// Invisible pick layer: a constant screen-size hit target around each dot, so small dots stay comfortable to click.
const PICK_RADIUS_PIXELS = 14

/**
 * Builds the shared station-dot layer stack used by both the trip flow and
 * infrastructure layers: an optional selection halo, the visible dots, an
 * enlarged hover overlay, and an optional invisible hit layer for picking.
 * Radii are geographic (meters) with a pixel cap, so dots shrink with the
 * map when zoomed out and cap out at a constant size when zoomed in; the
 * hover overlay is a separate layer because the cap is per-layer and would
 * clip an enlarged radius in the main layer. Layer ids derive from `id`
 * (`${id}-selection-halo/-hover/-hit`) so `POINT_LAYER_ID_PREFIXES` and the
 * `startsWith` checks in `useMapClickActions` keep matching by prefix.
 * @param {string} id - Base layer id (also the visible dots layer id).
 * @param {Array} stations - Station data with id, latitude, and longitude.
 * @param {Function} getColor - Fill color accessor, caller palette (RGB or RGBA).
 * @param {Array} selectedStationIds - Station ids that receive the halo ring.
 * @param {string|null} hoveredStationId - Hovered station id, enlarged via the overlay.
 * @param {number} baseRadius - Dot radius in meters.
 * @param {number} maxRadiusPixels - Pixel cap the dots stop growing at when zoomed in.
 * @param {boolean} withHitLayer - Add the invisible pick layer.
 * @param {Function} onPick - Click handler, attached to the hit layer.
 * @param {Function} onHover - Hover handler, attached to the hit layer.
 * @param {Array} colorUpdateTriggers - Extra caller triggers for the fill color.
 * @returns {Array} Deck.gl layers in render order: [halo?, dots, hover?, hit?].
 */
export function createStationDotsLayers({
    id,
    stations,
    getColor,
    selectedStationIds = [],
    hoveredStationId = null,
    baseRadius = 90,
    maxRadiusPixels = 6,
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
            radiusMinPixels: HALO_MIN_RADIUS_PIXELS,
            radiusMaxPixels: maxRadiusPixels * HALO_RADIUS_MULTIPLIER,
            pickable: false,
            parameters: { depthTest: false },
        }))
    }

    layers.push(new ScatterplotLayer({
        id,
        data: stations,
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: baseRadius,
        getFillColor: getColor,
        getLineColor: WHITE_RGB,
        lineWidthMinPixels: 1,
        stroked: true,
        filled: true,
        radiusUnits: 'meters',
        radiusMinPixels: MIN_RADIUS_PIXELS,
        radiusMaxPixels: maxRadiusPixels,
        pickable: false,
        transitions: {
            getFillColor: {
                duration: 180,
            },
        },
        updateTriggers: {
            getFillColor: [hoveredStationId, selectionKey, ...colorUpdateTriggers],
        },
    }))

    const hoveredStation = hoveredStationId
        ? stations.find((d) => d.id === hoveredStationId)
        : null
    if (hoveredStation) {
        layers.push(new ScatterplotLayer({
            id: `${id}-hover`,
            data: [hoveredStation],
            getPosition: (d) => [d.longitude, d.latitude],
            getRadius: baseRadius * HOVER_RADIUS_MULTIPLIER,
            getFillColor: getColor,
            getLineColor: WHITE_RGB,
            lineWidthMinPixels: 1.5,
            stroked: true,
            filled: true,
            radiusUnits: 'meters',
            radiusMinPixels: MIN_RADIUS_PIXELS * HOVER_RADIUS_MULTIPLIER,
            radiusMaxPixels: maxRadiusPixels * HOVER_RADIUS_MULTIPLIER,
            pickable: false,
            parameters: { depthTest: false },
        }))
    }

    if (withHitLayer) {
        layers.push(new ScatterplotLayer({
            id: `${id}-hit`,
            data: stations,
            getPosition: (d) => [d.longitude, d.latitude],
            getRadius: PICK_RADIUS_PIXELS,
            getFillColor: [0, 0, 0, 0],
            stroked: false,
            filled: true,
            radiusUnits: 'pixels',
            pickable: true,
            onClick: onPick,
            onHover,
            parameters: { depthTest: false },
        }))
    }

    return layers
}
