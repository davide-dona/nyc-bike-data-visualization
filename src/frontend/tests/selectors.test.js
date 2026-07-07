import { describe, it, expect } from 'vitest'

import {
    selectStations,
    getStationForCurrentTime,
    getMaxUsage,
    getMaxDelta,
} from '@/features/map/utils/stationUsageSelector.js'
import {
    classifyStationHealth,
    selectStationAvailability,
    HEALTH_CATEGORY,
} from '@/features/map/utils/stationAvailabilitySelector.js'
import { stationCharacter } from '@/features/map/hooks/useInfrastructureStationSidebarData.js'

// One observed day: each hour-of-day bucket occurred once (hours_count 1),
// so the per-day averages equal the raw counts
const USAGE_FIXTURE = [{
    station_id: 'S1',
    lat: 40.75,
    lon: -73.97,
    groups: [
        { hour: 8, outgoing_rides: 10, incoming_rides: 2, total_rides: 12, hours_count: 1 },
        { hour: 17, outgoing_rides: 0, incoming_rides: 9, total_rides: 9, hours_count: 1 },
    ],
}]

describe('stationUsageSelector usage modes', () => {
    it('selectStations builds one hourly series per mode', () => {
        const [station] = selectStations(USAGE_FIXTURE)

        expect(station.hourlyByMode.all[8]).toBe(12)
        expect(station.hourlyByMode.outgoing[8]).toBe(10)
        expect(station.hourlyByMode.incoming[8]).toBe(2)
        // Zero outgoing while incoming is positive must not drop the bucket
        expect(station.hourlyByMode.outgoing[17]).toBe(0)
        expect(station.hourlyByMode.incoming[17]).toBe(9)

        expect(station.meanByMode.all).toBeCloseTo(21 / 24)
        expect(station.meanByMode.outgoing).toBeCloseTo(10 / 24)
        expect(station.meanByMode.incoming).toBeCloseTo(11 / 24)
    })

    it('getStationForCurrentTime reads the selected mode at integer and fractional hours', () => {
        const stations = selectStations(USAGE_FIXTURE)

        expect(getStationForCurrentTime(stations, 8, 'outgoing')[0].usage).toBe(10)
        expect(getStationForCurrentTime(stations, 8, 'incoming')[0].usage).toBe(2)
        // Halfway between hour 8 (10) and hour 9 (0)
        expect(getStationForCurrentTime(stations, 8.5, 'outgoing')[0].usage).toBeCloseTo(5)
        expect(getStationForCurrentTime(stations, 8, 'outgoing')[0].meanUsage).toBeCloseTo(10 / 24)
    })

    it('getMaxUsage and getMaxDelta scale per mode', () => {
        const stations = selectStations(USAGE_FIXTURE)

        expect(getMaxUsage(stations, 'all')).toBe(12)
        expect(getMaxUsage(stations, 'outgoing')).toBe(10)
        expect(getMaxUsage(stations, 'incoming')).toBe(9)
        expect(getMaxDelta(stations, 'outgoing')).toBeCloseTo(10 - 10 / 24)
        expect(getMaxDelta(stations, 'incoming')).toBeCloseTo(9 - 11 / 24)
    })
})

describe('classifyStationHealth', () => {
    it('returns healthy when both sides are above the threshold', () => {
        expect(classifyStationHealth({ bikes: 15, docks: 15, actualCapacity: 30 })).toBe(HEALTH_CATEGORY.HEALTHY)
    })

    it('returns empty risk when bikes are scarce', () => {
        expect(classifyStationHealth({ bikes: 1, docks: 29, actualCapacity: 30 })).toBe(HEALTH_CATEGORY.EMPTY_RISK)
    })

    it('returns full risk when docks are scarce', () => {
        expect(classifyStationHealth({ bikes: 28, docks: 2, actualCapacity: 30 })).toBe(HEALTH_CATEGORY.FULL_RISK)
    })

    it('classifies by the scarcer side when both are low', () => {
        expect(classifyStationHealth({ bikes: 0, docks: 1, actualCapacity: 6 })).toBe(HEALTH_CATEGORY.EMPTY_RISK)
        expect(classifyStationHealth({ bikes: 1, docks: 0, actualCapacity: 6 })).toBe(HEALTH_CATEGORY.FULL_RISK)
    })

    it('returns unknown when usable capacity is zero or invalid', () => {
        expect(classifyStationHealth({ bikes: 0, docks: 0, actualCapacity: 0 })).toBe(HEALTH_CATEGORY.UNKNOWN)
        expect(classifyStationHealth({ bikes: 0, docks: 0, actualCapacity: NaN })).toBe(HEALTH_CATEGORY.UNKNOWN)
    })

    it('applies the 2-unit floor at tiny stations', () => {
        // capacity 8 => 15% rounds up to 2, so a single bike is still at risk
        expect(classifyStationHealth({ bikes: 1, docks: 7, actualCapacity: 8 })).toBe(HEALTH_CATEGORY.EMPTY_RISK)
        expect(classifyStationHealth({ bikes: 2, docks: 6, actualCapacity: 8 })).toBe(HEALTH_CATEGORY.HEALTHY)
    })
})

describe('selectStationAvailability', () => {
    it('attaches a health_category to each station', () => {
        const [station] = selectStationAvailability([{
            id: 'S1',
            name: 'Test',
            lat: 40.75,
            lon: -73.97,
            capacity: 30,
            num_bikes_available: 1,
            num_classic_bikes_available: 1,
            num_ebikes_available: 0,
            num_docks_available: 29,
            num_bikes_disabled: 0,
        }])
        expect(station.health_category).toBe(HEALTH_CATEGORY.EMPTY_RISK)
    })
})

function hourSeriesWith(overrides) {
    return Array.from({ length: 24 }, (_, hour) => ({
        hour,
        avg_incoming: 1,
        avg_outgoing: 1,
        ...(overrides[hour] ?? {}),
    }))
}

describe('stationCharacter', () => {
    it('labels morning-sink / evening-source stations workplace-like', () => {
        const series = hourSeriesWith({
            7: { avg_incoming: 10, avg_outgoing: 1 },
            8: { avg_incoming: 12, avg_outgoing: 1 },
            17: { avg_incoming: 1, avg_outgoing: 11 },
            18: { avg_incoming: 1, avg_outgoing: 9 },
        })
        expect(stationCharacter(series).label).toBe('Workplace-like')
    })

    it('labels morning-source / evening-sink stations residential-like', () => {
        const series = hourSeriesWith({
            7: { avg_incoming: 1, avg_outgoing: 10 },
            8: { avg_incoming: 1, avg_outgoing: 12 },
            17: { avg_incoming: 11, avg_outgoing: 1 },
            18: { avg_incoming: 9, avg_outgoing: 1 },
        })
        expect(stationCharacter(series).label).toBe('Residential-like')
    })

    it('labels symmetric stations balanced', () => {
        expect(stationCharacter(hourSeriesWith({})).label).toBe('Balanced')
    })
})

// --- Footprint math ---

import {
    kmToCo2Tonnes,
    avoidedCo2Tonnes,
    avoidedCo2Range,
    buildCumulativeAvoidedSeries,
} from '../features/footprint/utils/footprint_math.js'
import { CAR_G_PER_KM, SUBSTITUTION_RATE } from '../features/footprint/utils/emission_factors.js'

describe('footprint math', () => {
    it('converts km to tonnes for a per-km factor', () => {
        // 1,000,000 km at 251 g/km is exactly 251 t
        expect(kmToCo2Tonnes(1_000_000, 251)).toBeCloseTo(251)
        expect(kmToCo2Tonnes(0, 251)).toBe(0)
    })

    it('discounts avoided CO2 by the substitution rate against the car factor', () => {
        expect(avoidedCo2Tonnes(1_000_000, 0.5)).toBeCloseTo(kmToCo2Tonnes(500_000, CAR_G_PER_KM))
    })

    it('always returns a low < high avoided range', () => {
        const range = avoidedCo2Range(1_000_000)
        expect(range.low).toBeLessThan(range.high)
        expect(range.low).toBeCloseTo(avoidedCo2Tonnes(1_000_000, SUBSTITUTION_RATE.low))
        expect(range.high).toBeCloseTo(avoidedCo2Tonnes(1_000_000, SUBSTITUTION_RATE.high))
    })

    it('builds a date-sorted cumulative series with mid inside the band', () => {
        const rows = [
            { date: '2026-04-02', total_distance_km: 200 },
            { date: '2026-04-01', total_distance_km: 100 },
        ]
        const series = buildCumulativeAvoidedSeries(rows, SUBSTITUTION_RATE.mid)

        expect(series.dates).toEqual(['2026-04-01', '2026-04-02'])
        // Cumulative: day 2 covers 300 km total
        expect(series.mid[1]).toBeCloseTo(avoidedCo2Tonnes(300, SUBSTITUTION_RATE.mid))
        series.dates.forEach((_, index) => {
            expect(series.low[index]).toBeLessThanOrEqual(series.mid[index])
            expect(series.mid[index]).toBeLessThanOrEqual(series.high[index])
        })
    })

    it('drops rows without a date or a numeric distance', () => {
        const series = buildCumulativeAvoidedSeries(
            [{ date: null, total_distance_km: 10 }, { date: '2026-04-01', total_distance_km: 'n/a' }],
            SUBSTITUTION_RATE.mid,
        )
        expect(series.dates).toEqual([])
    })
})
