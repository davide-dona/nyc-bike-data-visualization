import { GeoJsonLayer } from '@deck.gl/layers'

/**
 * Color map for bike facility classes - editorial palette (forest = safe, accent = primary, amber = caution).
 */
export const FACILITY_COLORS = {
    I:   [ 47, 125,  79, 255],   // forest - protected
    II:  [ 25,  83, 216, 255],   // accent - conventional
    III: [200, 138,  26, 255],   // amber  - shared lane / signed route
    L:   [110, 106, 98, 255],    // ink-muted - link, lowest protection
    _default: [110, 106, 98, 255], // ink-muted - unknown
}

/**
 * Facility-class labels, worded as NYC DOT defines them in the dataset's
 * data dictionary (Data-Dictionary-BicycleRoutes.xlsx, facilitycl).
 */
export const FACILITY_LABELS = {
    I:   'Protected',
    II:  'Conventional',
    III: 'Shared Lane / Signed Route',
    L:   'Link',
    _default: 'Unknown'
}

/**
 * CSS-friendly color strings mirrored from FACILITY_COLORS, for the React legend component.
 */
export const FACILITY_CSS_COLORS = {
    I:   'rgb(47, 125, 79)',
    II:  'rgb(25, 83, 216)',
    III: 'rgb(200, 138, 26)',
    L:   'rgb(110, 106, 98)',
    _default: 'rgb(110, 106, 98)',
}

// Geographic width with a pixel cap, mirroring the station-dot sizing approach.
const LINE_WIDTH_M = 18
const LINE_WIDTH_MIN_PIXELS = 0.75
const LINE_WIDTH_MAX_PIXELS = 5

/**
 * Builds the GeoJSON line layer for bike routes.
 * @param {Array}    routes         - Array of GeoJSON Feature objects.
 * @param {number|null} hoveredrouteID - The routeID of the currently hovered route segment, or null if none.
 * @param {function} onRoutePick    - Callback function to handle hover/click events on route segments.
 * @returns {GeoJsonLayer|null}
 */
export function createBikeRoutesLayer({ routes, hoveredrouteID, onRoutePick }) {
    if (!routes?.length) return null
    return new GeoJsonLayer({
        id: 'bike-routes-line-layer',
        data: routes,
        stroked: true,
        filled: false,
        getLineWidth: LINE_WIDTH_M,
        lineWidthUnits: 'meters',
        lineWidthMinPixels: LINE_WIDTH_MIN_PIXELS,
        lineWidthMaxPixels: LINE_WIDTH_MAX_PIXELS,
        // Highlight every segment sharing the hovered routeID.
        getLineColor: (f) => {
            const base = FACILITY_COLORS[f.facilityClass] ?? FACILITY_COLORS._default
            if (hoveredrouteID == null) return base
            return f.routeID === hoveredrouteID
                ? [255, 255, 255, 255]
                : [base[0], base[1], base[2], 255]
        },
        pickable: true,
        autoHighlight: false, // manual highlighting via getLineColor above
        onHover: onRoutePick,
        onClick: onRoutePick,
        // Rebuild colour accessor whenever the hovered id changes
        updateTriggers: {
            getLineColor: [hoveredrouteID],
        },
    })
}

/**
 * Returns a plain-text tooltip for a hovered bike route feature (title + detail list, matching tripArcsTooltip's convention).
 * @param {Object} object - The hovered GeoJSON feature (from deck.gl onHover).
 * @returns {string}
 */
export function bikeRouteTooltip(object) {
    if (!object) return ''
    const { streetName, facilityClass, fromStreet, toStreet } = object
    const classLabel = FACILITY_LABELS[facilityClass] ?? 'Unknown'

    return `Bike Route\n${streetName}\n\n - Segment: ${fromStreet} → ${toStreet}\n - Facility Class: ${classLabel}`
}

/**
 * Returns the legend entries for the bike-routes layer as plain data.
 * `MapLegend` renders them uniformly alongside every other layer's entries.
 */
export function bikeRoutesLegend() {
    return {
        entries: [
            { key: 'I',   swatch: FACILITY_CSS_COLORS.I,   label: FACILITY_LABELS.I },
            { key: 'II',  swatch: FACILITY_CSS_COLORS.II,  label: FACILITY_LABELS.II },
            { key: 'III', swatch: FACILITY_CSS_COLORS.III, label: FACILITY_LABELS.III },
            { key: 'L',   swatch: FACILITY_CSS_COLORS.L,   label: FACILITY_LABELS.L },
        ],
    }
}