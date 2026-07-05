import { describe, it, expect } from 'vitest'

import {
    BORO_LABELS,
    aggregateInstallationsByYear,
    aggregatePeakHourDistribution,
    aggregateRoutesByBorough,
    aggregateRoutesByFacilityClass,
    topCorridors,
    topStationsByUsage,
} from '../features/map/insights/insightSelectors.js'
import { selectStations } from '../features/map/layers/station_usage_layer/stationUsageSelector.js'

const route = (overrides) => ({
    instDate: '2020-06-01',
    retiredDate: null,
    facilityClass: 'II',
    boro: '1',
    ...overrides,
})

describe('aggregateInstallationsByYear', () => {
    it('builds contiguous year labels from the earliest installation to currentYear', () => {
        const { labels, values } = aggregateInstallationsByYear(
            [route({ instDate: '2019-03-01' }), route({ instDate: '2019-11-11' }), route({ instDate: '2021-01-01' })],
            2022,
        )
        expect(labels).toEqual(['2019', '2020', '2021', '2022'])
        // 2020 and 2022 are gap years and must render as explicit zeros
        expect(values).toEqual([2, 0, 1, 0])
    })

    it('ignores missing, unparseable, and future installation dates', () => {
        const { labels, values } = aggregateInstallationsByYear(
            [route({ instDate: null }), route({ instDate: 'garbage' }), route({ instDate: '2031-01-01' }), route({ instDate: '2022-05-05' })],
            2022,
        )
        expect(labels).toEqual(['2022'])
        expect(values).toEqual([1])
    })
})

describe('aggregateRoutesByBorough', () => {
    it('keeps the fixed borough order and maps numeric-code strings', () => {
        const { labels, values } = aggregateRoutesByBorough([
            route({ boro: '3' }), route({ boro: '3' }), route({ boro: '1' }), route({ boro: '5' }),
        ])
        expect(labels).toEqual(Object.values(BORO_LABELS))
        expect(values).toEqual([1, 0, 2, 0, 1])
    })

    it('accepts borough names as served by the bike-routes API', () => {
        const { values } = aggregateRoutesByBorough([
            route({ boro: 'Brooklyn' }), route({ boro: 'Brooklyn' }), route({ boro: 'Manhattan' }),
        ])
        expect(values).toEqual([1, 0, 2, 0, 0])
    })

    it('folds unknown codes into a trailing Unknown bucket only when present', () => {
        const known = aggregateRoutesByBorough([route({ boro: '2' })])
        expect(known.labels).not.toContain('Unknown')

        const { labels, values } = aggregateRoutesByBorough([route({ boro: '9' }), route({ boro: null })])
        expect(labels.at(-1)).toBe('Unknown')
        expect(values.at(-1)).toBe(2)
    })
})

describe('aggregateRoutesByFacilityClass', () => {
    it('keeps the fixed class order I, II, III, L including zero classes', () => {
        const { classes, values } = aggregateRoutesByFacilityClass([
            route({ facilityClass: 'L' }), route({ facilityClass: 'I' }), route({ facilityClass: 'I' }),
        ])
        expect(classes).toEqual(['I', 'II', 'III', 'L'])
        expect(values).toEqual([2, 0, 0, 1])
    })

    it('folds unlisted classes into a trailing _default bucket', () => {
        const { classes, values } = aggregateRoutesByFacilityClass([route({ facilityClass: 'X' })])
        expect(classes).toEqual(['I', 'II', 'III', 'L', '_default'])
        expect(values).toEqual([0, 0, 0, 0, 1])
    })
})

// Two stations, one observed day each: every hour bucket occurred once
// (hours_count 1), so per-day averages equal the raw counts
const USAGE_FIXTURE = [
    {
        station_id: 'S1',
        station_name: 'Alpha St & 1 Av',
        lat: 40.75,
        lon: -73.97,
        groups: [
            { hour: 8, outgoing_rides: 10, incoming_rides: 2, total_rides: 12, hours_count: 1 },
            { hour: 17, outgoing_rides: 1, incoming_rides: 9, total_rides: 10, hours_count: 1 },
        ],
    },
    {
        station_id: 'S2',
        station_name: 'Beta Sq',
        lat: 40.7,
        lon: -73.9,
        groups: [
            { hour: 17, outgoing_rides: 3, incoming_rides: 3, total_rides: 6, hours_count: 1 },
        ],
    },
]

describe('aggregatePeakHourDistribution', () => {
    it('counts stations at their busiest hour for the selected mode', () => {
        const stations = selectStations(USAGE_FIXTURE)

        const all = aggregatePeakHourDistribution(stations, 'all')
        expect(all.labels).toHaveLength(24)
        expect(all.values[8]).toBe(1)  // S1 peaks at 8 (12 > 10)
        expect(all.values[17]).toBe(1) // S2 peaks at 17
        expect(all.values.reduce((a, b) => a + b, 0)).toBe(2)

        const incoming = aggregatePeakHourDistribution(stations, 'incoming')
        expect(incoming.values[17]).toBe(2) // both peak at 17 for incoming
    })

    it('excludes flat zero-usage stations instead of counting them at hour 0', () => {
        const stations = selectStations([{ station_id: 'S0', station_name: 'Idle', lat: 0, lon: 0, groups: [] }])
        const { values } = aggregatePeakHourDistribution(stations, 'all')
        expect(values.every((count) => count === 0)).toBe(true)
    })
})

describe('topStationsByUsage', () => {
    it('ranks by average rides per day with station names as labels', () => {
        const stations = selectStations(USAGE_FIXTURE)
        const { labels, values } = topStationsByUsage(stations, 'all', 10)

        expect(labels).toEqual(['Alpha St & 1 Av', 'Beta Sq'])
        // meanByMode.all * 24 restores rides per day: S1 = 22, S2 = 6
        expect(values[0]).toBeCloseTo(22)
        expect(values[1]).toBeCloseTo(6)
    })

    it('caps the list at n and falls back to the station id without a name', () => {
        const stations = selectStations(USAGE_FIXTURE).map(({ name, ...rest }) => rest)
        const { labels } = topStationsByUsage(stations, 'all', 1)
        expect(labels).toEqual(['S1'])
    })
})

describe('topCorridors', () => {
    const trip = (overrides) => ({
        start_station_name: 'A',
        end_station_name: 'B',
        total_daily_flow: 1,
        a_to_b_flow: 0.6,
        b_to_a_flow: 0.4,
        ...overrides,
    })

    it('ranks pairs by total daily flow and keeps per-direction values', () => {
        const { labels, aToB, bToA } = topCorridors([
            trip({ start_station_name: 'Low', total_daily_flow: 1 }),
            trip({ start_station_name: 'High', total_daily_flow: 9, a_to_b_flow: 5, b_to_a_flow: 4 }),
        ], 10)

        expect(labels).toEqual(['High <> B', 'Low <> B'])
        expect(aToB).toEqual([5, 0.6])
        expect(bToA).toEqual([4, 0.4])
    })

    it('handles short lists and does not mutate its input order', () => {
        const trips = [trip({ total_daily_flow: 1 }), trip({ total_daily_flow: 2 })]
        const { labels } = topCorridors(trips, 1)
        expect(labels).toHaveLength(1)
        expect(trips[0].total_daily_flow).toBe(1) // input untouched
    })

    it('returns empty series for no selection', () => {
        expect(topCorridors([], 10)).toEqual({ labels: [], aToB: [], bToA: [] })
        expect(topCorridors(null, 10).labels).toEqual([])
    })
})
