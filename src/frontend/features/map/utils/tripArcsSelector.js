/**
 * Selector to process raw trip count data into a format suitable for visualization.
 * @param {Object} tripCounts 
 * @returns 
 */
export function selectTrips(tripCounts) {
    // Handle case where tripCounts is undefined or null
    if (!tripCounts) return []
    return tripCounts
        .map((trip) => {
            const {
                station_a_id: start_station_id,
                station_a_name: start_station_name,
                station_a_lat: start_station_lat,
                station_a_lon: start_station_lon,
                station_b_id: end_station_id,
                station_b_name: end_station_name,
                station_b_lat: end_station_lat,
                station_b_lon: end_station_lon,
                groups: [{ total_rides, hours_count, a_to_b_count, b_to_a_count }],
            } = trip;
            const daysCount = Number(hours_count) / 24; // Convert hours count to days count for average daily flow calculation
            return {
                start_station_id,
                start_station_name,
                start_station_lat,
                start_station_lon,
                end_station_id,
                end_station_name,
                end_station_lat,
                end_station_lon,
                total_rides: Number(total_rides) || 0,
                total_daily_flow: daysCount > 0 ? total_rides / daysCount : 0, // Convert to average daily rides
                a_to_b_flow: daysCount > 0 ? a_to_b_count / daysCount : 0,
                b_to_a_flow: daysCount > 0 ? b_to_a_count / daysCount : 0,
            };
        })
        .filter(
            (trip) =>
                // Round trips (same start and end station) are not corridors:
                // they cannot render as arcs and would clutter the rankings
                trip.start_station_id !== trip.end_station_id &&
                Number.isFinite(trip.start_station_lat) &&
                Number.isFinite(trip.start_station_lon) &&
                Number.isFinite(trip.end_station_lat) &&
                Number.isFinite(trip.end_station_lon) &&
                Number.isFinite(trip.total_daily_flow)
        );
}

/**
 * Reorients trip rows so the focused station is always the start endpoint:
 * a_to_b_flow reads as outbound (focused to partner) and b_to_a_flow as
 * inbound (partner to focused). Rows already starting at the focused station,
 * or not touching it at all, pass through unchanged. Row shape is preserved,
 * so arc layers and tooltips consume oriented rows transparently.
 * @param {Array} trips - Processed trip rows from selectTrips.
 * @param {string} focusedStationId - Station to orient the rows around.
 * @returns {Array} Trip rows with the focused station as start endpoint.
 */
export function orientTripsToFocus(trips, focusedStationId) {
    return (trips ?? []).map((trip) => {
        if (trip.end_station_id !== focusedStationId) return trip
        return {
            ...trip,
            start_station_id: trip.end_station_id,
            start_station_name: trip.end_station_name,
            start_station_lat: trip.end_station_lat,
            start_station_lon: trip.end_station_lon,
            end_station_id: trip.start_station_id,
            end_station_name: trip.start_station_name,
            end_station_lat: trip.start_station_lat,
            end_station_lon: trip.start_station_lon,
            a_to_b_flow: trip.b_to_a_flow,
            b_to_a_flow: trip.a_to_b_flow,
        }
    })
}

/**
 * Returns the maximum daily flow count across all trips.
 * @param {Array} trips - Array of processed trip objects from selectTrips
 * @returns {number} The maximum total_daily_flow value
 */
export function selectMaxFlow(trips) {
    return Math.max(...trips.map((trip) => trip.total_daily_flow));
}