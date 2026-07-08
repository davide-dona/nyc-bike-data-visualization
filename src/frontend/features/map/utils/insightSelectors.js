/**
 * Pure aggregations for the map insights panel. Every function works on the
 * arrays the map layers already hold client-side (bike routes, station usage
 * series, trip flow rows) so the panel never triggers extra fetches.
 */

import { getRouteInstallYear } from './routeYearFilter.js'
import { haversineKm } from '@/utils/math.js'

const HOURS_IN_DAY = 24

// NYC borough codes as they arrive from the bike-routes API ("1".."5")
export const BORO_LABELS = {
    1: 'Manhattan',
    2: 'Bronx',
    3: 'Brooklyn',
    4: 'Queens',
    5: 'Staten Island',
}

// Fixed display order for facility classes, matching the map legend hierarchy
export const FACILITY_CLASS_ORDER = ['I', 'II', 'III', 'L']

/**
 * Counts route segments by installation year over the full network history,
 * retired segments included: the chart reads as "how much was built when".
 * Labels are contiguous from the earliest installation year to currentYear so
 * gap years render as empty slots instead of silently disappearing.
 * @param {Array} routes - BikeRoute objects with instDate ('YYYY-MM-DD').
 * @param {number} [currentYear] - Upper bound for the label range.
 * @returns {{labels: string[], values: number[]}}
 */
export function aggregateInstallationsByYear(routes, currentYear = new Date().getFullYear()) {
    const countsByYear = new Map()
    let minYear = currentYear

    for (const route of routes ?? []) {
        const year = getRouteInstallYear(route)
        if (!Number.isFinite(year) || year <= 0 || year > currentYear) continue
        countsByYear.set(year, (countsByYear.get(year) ?? 0) + 1)
        if (year < minYear) minYear = year
    }

    const labels = []
    const values = []
    for (let year = minYear; year <= currentYear; year += 1) {
        labels.push(String(year))
        values.push(countsByYear.get(year) ?? 0)
    }
    return { labels, values }
}

/**
 * Counts route segments per borough, in fixed BORO_LABELS order. The API
 * serves boro either as a numeric-code string ("1".."5") or as the borough
 * name; both forms are accepted. Anything else folds into a trailing
 * 'Unknown' bucket, emitted only when non-empty.
 * @param {Array} routes - Year-filtered BikeRoute objects with a boro field.
 * @returns {{labels: string[], values: number[]}}
 */
export function aggregateRoutesByBorough(routes) {
    const counts = new Map(Object.values(BORO_LABELS).map((label) => [label, 0]))
    let unknown = 0

    for (const route of routes ?? []) {
        const label = BORO_LABELS[Number(route.boro)]
            ?? (counts.has(route.boro) ? route.boro : null)
        if (label) counts.set(label, counts.get(label) + 1)
        else unknown += 1
    }

    const labels = [...counts.keys()]
    const values = [...counts.values()]
    if (unknown > 0) {
        labels.push('Unknown')
        values.push(unknown)
    }
    return { labels, values }
}

/**
 * Counts route segments per facility class in fixed order I, II, III, L.
 * Unlisted classes fold into a trailing 'Unknown' bucket, emitted only when
 * non-empty. Returns class keys; the panel maps them to labels and colors.
 * @param {Array} routes - Year-filtered BikeRoute objects with facilityClass.
 * @returns {{classes: string[], values: number[]}}
 */
export function aggregateRoutesByFacilityClass(routes) {
    const counts = new Map(FACILITY_CLASS_ORDER.map((cls) => [cls, 0]))
    let unknown = 0

    for (const route of routes ?? []) {
        if (counts.has(route.facilityClass)) {
            counts.set(route.facilityClass, counts.get(route.facilityClass) + 1)
        } else {
            unknown += 1
        }
    }

    const classes = [...counts.keys()]
    const values = [...counts.values()]
    if (unknown > 0) {
        classes.push('_default')
        values.push(unknown)
    }
    return { classes, values }
}

/**
 * Distribution of stations by the hour their usage peaks: values[h] is the
 * number of stations whose busiest hour (for the given mode) is h. Stations
 * with a flat zero series carry no signal and are excluded. Ties resolve to
 * the earliest hour, matching Math.max-style argmax semantics.
 * @param {Array} stations - Station list from selectStations (hourlyByMode).
 * @param {string} mode - Usage mode ('all' | 'incoming' | 'outgoing').
 * @returns {{labels: string[], values: number[]}}
 */
export function aggregatePeakHourDistribution(stations, mode = 'all') {
    const values = Array.from({ length: HOURS_IN_DAY }, () => 0)

    for (const station of stations ?? []) {
        const hourly = station.hourlyByMode?.[mode]
        if (!Array.isArray(hourly)) continue
        let peakHour = -1
        let peakValue = 0
        for (let hour = 0; hour < HOURS_IN_DAY; hour += 1) {
            const usage = Number(hourly[hour])
            if (Number.isFinite(usage) && usage > peakValue) {
                peakValue = usage
                peakHour = hour
            }
        }
        if (peakHour >= 0) values[peakHour] += 1
    }

    return { labels: values.map((_, hour) => String(hour)), values }
}

/**
 * Top stations by average rides per day for the given mode.
 * meanByMode is a per-hour average, so a day is that mean times 24.
 * @param {Array} stations - Station list from selectStations.
 * @param {string} mode - Usage mode ('all' | 'incoming' | 'outgoing').
 * @param {number} n - How many stations to keep.
 * @returns {{labels: string[], values: number[]}}
 */
export function topStationsByUsage(stations, mode = 'all', n = 10) {
    const ranked = (stations ?? [])
        .map((station) => ({
            label: station.name ?? station.stationId,
            value: (Number(station.meanByMode?.[mode]) || 0) * HOURS_IN_DAY,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, n)

    return {
        labels: ranked.map((entry) => entry.label),
        values: ranked.map((entry) => entry.value),
    }
}

/**
 * Ranks corridors by total daily flow for the trip-flow corridor list. Works
 * for both modes: overview rows keep the backend's canonical pair order,
 * focus rows arrive oriented so outbound/inbound read relative to the
 * focused station.
 * @param {Array} trips - Processed trip rows from selectTrips (oriented in focus view).
 * @param {number} n - How many corridors to keep.
 * @returns {Array} Ranked rows with key, names, value, and directional split.
 */
export function rankCorridors(trips, n = 12) {
    return [...(trips ?? [])]
        .sort((a, b) => b.total_daily_flow - a.total_daily_flow)
        .slice(0, n)
        .map((trip) => ({
            key: trip.corridor_key,
            startName: trip.start_station_name,
            endName: trip.end_station_name,
            value: trip.total_daily_flow,
            outbound: trip.a_to_b_flow,
            inbound: trip.b_to_a_flow,
        }))
}

/**
 * Flow-weighted median of corridor straight-line distances: the distance at
 * which half of the daily rides happen on shorter corridors. Weighting by
 * flow keeps a long tail of quiet corridors from skewing the headline.
 * @param {Array} trips - Processed trip rows with endpoint coordinates.
 * @returns {number} Median corridor distance in kilometers, 0 when empty.
 */
function weightedMedianDistanceKm(trips) {
    const rows = (trips ?? [])
        .map((trip) => ({
            distance: haversineKm(
                trip.start_station_lat, trip.start_station_lon,
                trip.end_station_lat, trip.end_station_lon,
            ),
            flow: trip.total_daily_flow,
        }))
        .sort((a, b) => a.distance - b.distance)
    const totalFlow = rows.reduce((sum, row) => sum + row.flow, 0)
    if (!(totalFlow > 0)) return 0

    let cumulative = 0
    for (const row of rows) {
        cumulative += row.flow
        if (cumulative >= totalFlow / 2) return row.distance
    }
    return rows[rows.length - 1].distance
}

/**
 * Headline stats for the citywide trip-flow overview.
 * @param {Array} trips - Processed trip rows from selectTrips.
 * @returns {{totalDailyRides: number, corridorCount: number, medianDistanceKm: number}}
 */
export function tripFlowOverviewStats(trips) {
    const rows = trips ?? []
    return {
        totalDailyRides: rows.reduce((sum, trip) => sum + trip.total_daily_flow, 0),
        corridorCount: rows.length,
        medianDistanceKm: weightedMedianDistanceKm(rows),
    }
}

/**
 * Headline stats for a focused station's corridors. Expects rows oriented
 * with orientTripsToFocus, so a_to_b_flow reads as outbound.
 * @param {Array} orientedTrips - Trip rows oriented to the focused station.
 * @returns {{totalDailyRides: number, partnerCount: number, outboundShare: number, medianDistanceKm: number}}
 */
export function tripFlowFocusStats(orientedTrips) {
    const rows = orientedTrips ?? []
    const totalDailyRides = rows.reduce((sum, trip) => sum + trip.total_daily_flow, 0)
    const outboundRides = rows.reduce((sum, trip) => sum + trip.a_to_b_flow, 0)
    return {
        totalDailyRides,
        partnerCount: rows.length,
        outboundShare: totalDailyRides > 0 ? outboundRides / totalDailyRides : 0,
        medianDistanceKm: weightedMedianDistanceKm(rows),
    }
}
