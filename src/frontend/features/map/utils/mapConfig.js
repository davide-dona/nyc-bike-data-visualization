// List of available map layers
export const LAYER_OPTIONS = [
    { value: 'station_usage', hasAnimation: true, label: 'Station usage' },
    { value: 'trip_flow', hasAnimation: false, label: 'Trip flow' },
    { value: 'infrastructure', hasAnimation: false, label: 'Infrastructure' }
    // Future layers can be added here
]

// Options for the all/incoming/outgoing direction toggle shared by the
// station-usage and trip-flow layers
export const USAGE_MODE_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'incoming', label: 'Incoming' },
    { value: 'outgoing', label: 'Outgoing' },
]

// Initial view state centered on NYC
export const INITIAL_VIEW_STATE = {
    longitude: -73.97,
    latitude: 40.75,
    zoom: 10.8,
    pitch: 45,
    bearing: 0,
}

// Allowed zoom range for map interactions
export const MIN_ZOOM = 10
export const MAX_ZOOM = 15
// Allowed pitch range for map interactions
export const MIN_PITCH = 0
export const MAX_PITCH = 60

// Clamp bounds for NYC area to keep navigation constrained but still fluid.
export const MIN_LONGITUDE = -74.30
export const MAX_LONGITUDE = -73.65
export const MIN_LATITUDE = 40.45
export const MAX_LATITUDE = 40.95

// Deck.gl layer id prefixes that render clickable point features
export const POINT_LAYER_ID_PREFIXES = [
    'station-usage-layer',
    'trip-flow-stations-layer',
    'station-availability-layer',
]

// CartoDB Positron - subdued paper/grey basemap that lets the data layers carry
// the color weight. Same provider as Voyager, no API key required.
export const BASE_TILE_URL = 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
