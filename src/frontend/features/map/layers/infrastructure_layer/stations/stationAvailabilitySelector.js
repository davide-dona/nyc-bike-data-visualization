/**
 * Selector functions for processing raw station availability data into
 * a format suitable for map visualization
 */

export const HEALTH_CATEGORY = {
    HEALTHY: 'healthy',
    EMPTY_RISK: 'empty_risk',
    FULL_RISK: 'full_risk',
    UNKNOWN: 'unknown',
}

// A side (bikes or docks) is "at risk" below 15% of usable capacity, but never
// below 2 units - a single remaining bike/dock is not a dependable resource.
const LOW_SIDE_FRACTION = 0.15
const LOW_SIDE_MIN = 2

// Health is a failure-mode category rather than a score: a station fails its
// riders either by having nothing to rent (empty risk) or nowhere to return
// (full risk). When both sides are low, the scarcer side wins.
export function classifyStationHealth({ bikes, docks, actualCapacity }) {
    if (!Number.isFinite(actualCapacity) || actualCapacity <= 0) return HEALTH_CATEGORY.UNKNOWN
    const lowThreshold = Math.max(LOW_SIDE_MIN, Math.ceil(LOW_SIDE_FRACTION * actualCapacity))
    const bikesLow = bikes < lowThreshold
    const docksLow = docks < lowThreshold
    if (!bikesLow && !docksLow) return HEALTH_CATEGORY.HEALTHY
    return bikes <= docks ? HEALTH_CATEGORY.EMPTY_RISK : HEALTH_CATEGORY.FULL_RISK
}

export function selectStationAvailability(stationData) {
    // Ensure stationData is an array before processing
    const stationRows = Array.isArray(stationData) ? stationData : []

    const processedStations = stationRows.map((station) => {
        // Compute the actual capacity of the station by subtracting disabled bikes from total capacity
        const actual_capacity = station.capacity - station.num_bikes_disabled

        // Calculate availability score based on available bikes and actual capacity
        // Higher score indicates that the station has a lot of available bikes
        const availability_score = actual_capacity > 0
            ? (station.num_classic_bikes_available + station.num_ebikes_available) / actual_capacity
            : 0

        // Calculate dock score based on available docks and actual capacity
        // Higher score indicates that the station has a lot of available docks
        const dock_score = actual_capacity > 0
            ? station.num_docks_available / actual_capacity
            : 0

        const health_category = classifyStationHealth({
            bikes: station.num_classic_bikes_available + station.num_ebikes_available,
            docks: station.num_docks_available,
            actualCapacity: actual_capacity,
        })

        return {
            id: station.id,
            name: station.name,
            latitude: station.lat,
            longitude: station.lon,
            num_bikes_available: station.num_bikes_available,
            num_classic_bikes_available: station.num_classic_bikes_available,
            num_ebikes_available: station.num_ebikes_available,
            num_docks_available: station.num_docks_available,
            num_bikes_disabled: station.num_bikes_disabled,
            actual_capacity,
            classicalBikes: station.num_classic_bikes_available,
            electricBikes: station.num_ebikes_available,
            available_docks: station.num_docks_available,
            capacity: station.capacity,
            availability_score: availability_score,
            dock_score: dock_score,
            health_category: health_category
        }
    })
    return processedStations
}