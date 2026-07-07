/**
 * Pure aggregations for the map insights panel. Every function works on the
 * arrays the map layers already hold client-side (bike routes, station usage
 * series, trip flow rows) so the panel never triggers extra fetches.
 */

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
        const year = Number(route.instDate?.slice(0, 4))
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
 * Top station pairs by total daily flow for the citywide overview chart.
 * Labels are two-line arrays (one station name per line) so both endpoints
 * stay readable on the category axis. Values are pair totals: the backend's
 * a/b pair order carries no direction semantics, so no per-direction split
 * is offered here.
 * @param {Array} trips - Processed trip rows from selectTrips.
 * @param {number} n - How many pairs to keep.
 * @returns {{labels: string[][], values: number[]}}
 */
export function topCorridors(trips, n = 10) {
    const ranked = [...(trips ?? [])]
        .sort((a, b) => b.total_daily_flow - a.total_daily_flow)
        .slice(0, n)

    return {
        labels: ranked.map((trip) => [trip.start_station_name, `<> ${trip.end_station_name}`]),
        values: ranked.map((trip) => trip.total_daily_flow),
    }
}

/**
 * Top partner stations of the focused station by total daily flow, split by
 * direction. Expects rows oriented with orientTripsToFocus, where the focused
 * station is the start endpoint: a_to_b_flow is outbound (focused to partner)
 * and b_to_a_flow is inbound. Both series stay positive; the diverging chart
 * applies the sign.
 * @param {Array} orientedTrips - Trip rows oriented to the focused station.
 * @param {number} n - How many partners to keep.
 * @returns {{labels: string[], inbound: number[], outbound: number[]}}
 */
export function topPartnersByFlow(orientedTrips, n = 10) {
    const ranked = [...(orientedTrips ?? [])]
        .sort((a, b) => b.total_daily_flow - a.total_daily_flow)
        .slice(0, n)

    return {
        labels: ranked.map((trip) => trip.end_station_name),
        inbound: ranked.map((trip) => trip.b_to_a_flow),
        outbound: ranked.map((trip) => trip.a_to_b_flow),
    }
}
