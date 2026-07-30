// Paths are relative: the shared apiClient supplies the base URL
export const ENDPOINTS = {
    // Stations
    stations: () => '/stations/',
    stationsAvailability: () => '/stations/availability',
    stationsEmpty: () => '/stations/empty',
    stationById: (id) => `/stations/${id}`,
    stationAvailabilityById: (id) => `/stations/${id}/availability`,

    // Rides
    rides: () => '/rides/',
    rideById: (id) => `/rides/by_ride_id/${id}`,

    // Bike routes
    bikeRoutes: () => '/bike_routes/',

    // Stats
    stats: () => '/stats/',
    statsByWeather: () => '/stats/stats_by_weather',
    stationUsageCounts: () => '/stats/station_usage_counts',
    stationFlowCounts: () => '/stats/station_flow_counts',
    dateRange: () => '/stats/date_range',
}
