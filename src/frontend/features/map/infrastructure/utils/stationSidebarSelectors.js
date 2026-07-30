import { formatNumber } from '@/utils/numberFormat.js'

// Weekday labels indexed Monday-first, matching the backend's day_of_week
export const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_FULL = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays']

/**
 * Renders the sidebar's flow-balance highlight as human-readable text. The
 * balanced/imbalanced call is scale-invariant (based on the percentage
 * difference), but the surplus itself is shown as the actual net rides/day
 * count rather than a percentage.
 * @param {{pctDiff: number, netPerDay: number}} netFlow - Relative and absolute departures/arrivals difference.
 * @returns {string} Balanced, or the surplus direction with its daily count.
 */
export function flowBalanceText({ pctDiff, netPerDay }) {
    const pct = Math.round(Math.abs(pctDiff) * 100)
    if (pct < 1) return 'Balanced in/out'
    const count = formatNumber(Math.abs(netPerDay), 1)
    return pctDiff > 0 ? `+${count} departures/day` : `+${count} arrivals/day`
}

/**
 * Explains a station character label with its commute signature.
 * @param {string} label - Character label from the sidebar summary.
 * @returns {string|null} A short hint, or null for neutral profiles.
 */
export function characterHint(label) {
    if (label === 'Workplace-like') return 'AM arrivals · PM departures'
    if (label === 'Residential-like') return 'AM departures · PM arrivals'
    return null
}

/**
 * Returns today's Monday-first weekday index, matching DAY_ORDER/DAY_FULL.
 * @returns {number} 0 (Monday) through 6 (Sunday).
 */
export function todayWeekdayIndex() {
    return (new Date().getDay() + 6) % 7
}

// Commute windows and the share of window volume an imbalance must exceed to count as signal, not noise.
const MORNING_HOURS = [6, 7, 8, 9, 10]
const EVENING_HOURS = [16, 17, 18, 19, 20]
const CHARACTER_THRESHOLD = 0.15

/**
 * Builds an array of zeroed ride buckets.
 * @param {number} length - Number of buckets (7 for days, 24 for hours).
 * @returns {Array<Object>} Buckets with outgoing/incoming/total rides and hours_count at 0.
 */
function emptySeries(length) {
    return Array.from({ length }, () => ({ outgoing_rides: 0, incoming_rides: 0, total_rides: 0, hours_count: 0 }))
}

/**
 * Aggregates the sidebar API's per-station usage groups into day-of-week and
 * hour-of-day series plus overall totals, averaging by covered hours.
 * @param {Array<Object>} items - Per-station payloads from the sidebar API.
 * @returns {{daySeries: Array, hourSeries: Array, totals: Object}} The aggregated series and totals.
 */
export function aggregateUsage(items = []) {
    const dayBuckets = emptySeries(7)
    const hourBuckets = emptySeries(24)
    let totalOutgoing = 0
    let totalIncoming = 0
    let totalRides = 0
    let totalHours = 0

    for (const item of items) {
        for (const group of item?.usage?.[0]?.groups ?? []) {
            const outgoing = Number(group.outgoing_rides ?? 0)
            const incoming = Number(group.incoming_rides ?? 0)
            const rides = Number(group.total_rides ?? 0)
            const hoursCount = Number(group.hours_count ?? 0)

            totalOutgoing += outgoing
            totalIncoming += incoming
            totalRides += rides
            totalHours += hoursCount

            if (group.day_of_week !== null && group.day_of_week !== undefined) {
                const bucket = dayBuckets[group.day_of_week]
                bucket.outgoing_rides += outgoing
                bucket.incoming_rides += incoming
                bucket.total_rides += rides
                bucket.hours_count += hoursCount
            }

            if (group.hour !== null && group.hour !== undefined) {
                const bucket = hourBuckets[group.hour]
                bucket.outgoing_rides += outgoing
                bucket.incoming_rides += incoming
                bucket.total_rides += rides
                bucket.hours_count += hoursCount
            }
        }
    }

    return {
        daySeries: dayBuckets.map((bucket, dayIndex) => ({
            day_of_week: dayIndex,
            label: DAY_ORDER[dayIndex],
            ...bucket,
            // hours_count covers 24 hours per occurrence of this weekday in the range
            avg_rides: bucket.total_rides / Math.max(1, bucket.hours_count / 24),
        })),
        hourSeries: hourBuckets.map((bucket, hour) => ({
            hour,
            label: String(hour).padStart(2, '0'),
            ...bucket,
            avg_rides: bucket.total_rides / Math.max(1, bucket.hours_count),
            avg_incoming: bucket.incoming_rides / Math.max(1, bucket.hours_count),
            avg_outgoing: bucket.outgoing_rides / Math.max(1, bucket.hours_count),
        })),
        totals: {
            totalOutgoing,
            totalIncoming,
            totalRides,
            totalHours,
        },
    }
}

/**
 * Finds the row with the highest avg_rides.
 * @param {Array<Object>} series - Rows carrying an avg_rides value.
 * @returns {Object|null} The busiest row, or null for an empty series.
 */
function argmaxByAvgRides(series) {
    return series.reduce((best, row) => (row.avg_rides > (best?.avg_rides ?? -1) ? row : best), null)
}

/**
 * Classifies a station's commute character from its hourly in/out balance:
 * morning-in plus evening-out reads as workplace-like, the inverse as
 * residential-like, anything else as balanced.
 * @param {Array<Object>} hourSeries - Hourly rows with avg_incoming/avg_outgoing.
 * @returns {{label: string, morningNet: number, eveningNet: number}} The character label and window nets.
 */
export function stationCharacter(hourSeries) {
    const windowStats = (hours) => hours.reduce((acc, hour) => {
        const row = hourSeries[hour]
        acc.net += (row?.avg_incoming ?? 0) - (row?.avg_outgoing ?? 0)
        acc.volume += (row?.avg_incoming ?? 0) + (row?.avg_outgoing ?? 0)
        return acc
    }, { net: 0, volume: 0 })

    const morning = windowStats(MORNING_HOURS)
    const evening = windowStats(EVENING_HOURS)
    const significant = (w) => Math.abs(w.net) > CHARACTER_THRESHOLD * w.volume

    let label = 'Balanced'
    if (significant(morning) && significant(evening)) {
        if (morning.net > 0 && evening.net < 0) label = 'Workplace-like'
        else if (morning.net < 0 && evening.net > 0) label = 'Residential-like'
    }
    return { label, morningNet: morning.net, eveningNet: evening.net }
}

/**
 * Derives the sidebar's highlight summary from the aggregated usage.
 * @param {{daySeries: Array, hourSeries: Array, totals: Object}} aggregatedUsage - Result of aggregateUsage.
 * @returns {Object} peakHour, busiestDay, netFlow, and the station character.
 */
export function buildSummary({ daySeries, hourSeries, totals }) {
    const flowVolume = totals.totalOutgoing + totals.totalIncoming
    return {
        peakHour: argmaxByAvgRides(hourSeries),
        busiestDay: argmaxByAvgRides(daySeries),
        netFlow: {
            totalIncoming: totals.totalIncoming,
            totalOutgoing: totals.totalOutgoing,
            pctDiff: (totals.totalOutgoing - totals.totalIncoming) / Math.max(1, flowVolume),
            netPerDay: (totals.totalOutgoing - totals.totalIncoming) / Math.max(1, totals.totalHours / 24),
        },
        character: stationCharacter(hourSeries),
    }
}

/**
 * Merges the sidebar API's per-station flow lists into one deduplicated
 * station-pair list sorted by total rides.
 * @param {Array<Object>} items - Per-station payloads from the sidebar API.
 * @returns {Array<Object>} Station pairs with summed directional and total counts.
 */
export function aggregateFlows(items = []) {
    const byPair = new Map()

    for (const item of items) {
        for (const flow of item?.flows ?? []) {
            const key = `${flow.station_a_id}__${flow.station_b_id}`
            const previous = byPair.get(key) ?? {
                station_a_id: flow.station_a_id,
                station_a_name: flow.station_a_name,
                station_b_id: flow.station_b_id,
                station_b_name: flow.station_b_name,
                station_a_lat: flow.station_a_lat,
                station_a_lon: flow.station_a_lon,
                station_b_lat: flow.station_b_lat,
                station_b_lon: flow.station_b_lon,
                a_to_b_count: 0,
                b_to_a_count: 0,
                total_rides: 0,
            }

            const groupTotals = (flow.groups ?? []).reduce((acc, group) => {
                acc.a_to_b_count += Number(group.a_to_b_count ?? 0)
                acc.b_to_a_count += Number(group.b_to_a_count ?? 0)
                acc.total_rides += Number(group.total_rides ?? 0)
                return acc
            }, { a_to_b_count: 0, b_to_a_count: 0, total_rides: 0 })

            previous.a_to_b_count += groupTotals.a_to_b_count
            previous.b_to_a_count += groupTotals.b_to_a_count
            previous.total_rides += groupTotals.total_rides
            byPair.set(key, previous)
        }
    }

    return Array.from(byPair.values()).sort((a, b) => b.total_rides - a.total_rides)
}
