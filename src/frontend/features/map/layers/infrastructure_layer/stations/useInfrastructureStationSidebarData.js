import { useMemo } from 'react'
import useApiQueryWithFilters from '../../../../../clients/baseApiQuery.js'
import { fetchInfrastructureStationSidebarData } from './stationSidebarApi.js'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Commute windows and the share of window volume a net imbalance must exceed
// to count as a real commute signal rather than noise.
const MORNING_HOURS = [6, 7, 8, 9, 10]
const EVENING_HOURS = [16, 17, 18, 19, 20]
const CHARACTER_THRESHOLD = 0.15

function emptySeries(length) {
    return Array.from({ length }, () => ({ outgoing_rides: 0, incoming_rides: 0, total_rides: 0, hours_count: 0 }))
}

function aggregateUsage(items = []) {
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
            label: DAY_LABELS[dayIndex],
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

function argmaxByAvgRides(series) {
    return series.reduce((best, row) => (row.avg_rides > (best?.avg_rides ?? -1) ? row : best), null)
}

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

function buildSummary({ daySeries, hourSeries, totals }) {
    const flowVolume = totals.totalOutgoing + totals.totalIncoming
    return {
        peakHour: argmaxByAvgRides(hourSeries),
        busiestDay: argmaxByAvgRides(daySeries),
        netFlow: {
            totalIncoming: totals.totalIncoming,
            totalOutgoing: totals.totalOutgoing,
            pctDiff: (totals.totalOutgoing - totals.totalIncoming) / Math.max(1, flowVolume),
        },
        character: stationCharacter(hourSeries),
    }
}

function aggregateFlows(items = []) {
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

export default function useInfrastructureStationSidebarData({ stationIds = [], filters = {} } = {}) {
    const queryFilters = useMemo(() => ({
        ...filters,
        stationIds,
    }), [filters, stationIds])

    const query = useApiQueryWithFilters({
        queryKey: 'infrastructure-station-sidebar-data',
        fetcher: fetchInfrastructureStationSidebarData,
        filters: queryFilters,
        enabledWhen: ({ stationIds: ids = [], start_date, end_date }) => Array.isArray(ids) && ids.length > 0 && Boolean(start_date && end_date),
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        fallbackData: { items: [], selectionFilters: {} },
    })

    return useMemo(() => {
        const items = query.data?.items ?? []
        const aggregatedUsage = aggregateUsage(items)
        const aggregatedFlows = aggregateFlows(items)

        return {
            loading: query.loading,
            error: query.error,
            refetch: query.refetch,
            items,
            daySeries: aggregatedUsage.daySeries,
            hourSeries: aggregatedUsage.hourSeries,
            totals: aggregatedUsage.totals,
            summary: buildSummary(aggregatedUsage),
            topFlows: aggregatedFlows.slice(0, 6),
        }
    }, [query.data, query.error, query.loading, query.refetch])
}
