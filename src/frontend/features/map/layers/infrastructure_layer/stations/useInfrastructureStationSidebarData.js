import { useMemo } from 'react'
import useApiQueryWithFilters from '../../../../../clients/baseApiQuery.js'
import { fetchInfrastructureStationSidebarData } from './stationSidebarApi.js'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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
        })),
        hourSeries: hourBuckets.map((bucket, hour) => ({
            hour,
            label: String(hour).padStart(2, '0'),
            ...bucket,
        })),
        totals: {
            totalOutgoing,
            totalIncoming,
            totalRides,
            totalHours,
        },
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
            topFlows: aggregatedFlows.slice(0, 6),
        }
    }, [query.data, query.error, query.loading, query.refetch])
}
