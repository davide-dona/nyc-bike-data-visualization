import { describe, it, expect } from 'vitest'

import { marginalizeDayHour } from '../features/temporal/utils/marginalize_stats.js'
import { sumFootprintTotals } from '../features/footprint/utils/footprint_math.js'

// One backend day,hour group row; hours_count is the spine hours of that cell
const cell = (day, hour, overrides = {}) => ({
    day_of_week: day,
    hour,
    total_rides: 0,
    hours_count: 2,
    hours_with_rides: 0,
    total_duration_seconds: 0,
    total_distance_km: 0,
    average_duration_seconds: 0,
    average_distance_km: 0,
    average_speed_kmh: 0,
    rides_per_hour_std: null,
    average_speed_kmh_std: null,
    ...overrides,
})

// 2 days x 3 hours grid over a 2-week range (each cell covers 2 spine hours)
const GRID = [
    cell(0, 7, { total_rides: 4, hours_with_rides: 2, total_duration_seconds: 3600, total_distance_km: 12 }),
    cell(0, 8, { total_rides: 6, hours_with_rides: 2, total_duration_seconds: 7200, total_distance_km: 24 }),
    cell(0, 9), // zero-ride spine cell survives as a zero bucket contribution
    cell(1, 7, { total_rides: 2, hours_with_rides: 1, total_duration_seconds: 1800, total_distance_km: 9 }),
    cell(1, 8, { total_rides: 8, hours_with_rides: 2, total_duration_seconds: 10800, total_distance_km: 36 }),
    cell(1, 9),
]

describe('marginalizeDayHour', () => {
    it('sums the additive totals per day of week and nulls the hour dimension', () => {
        const days = marginalizeDayHour(GRID, 'day_of_week')

        expect(days.map((row) => row.day_of_week)).toEqual([0, 1])
        expect(days.every((row) => row.hour === null)).toBe(true)
        expect(days[0].total_rides).toBe(10)
        expect(days[0].hours_count).toBe(6)
        expect(days[0].hours_with_rides).toBe(4)
        expect(days[1].total_rides).toBe(10)
        expect(days[1].total_distance_km).toBe(45)
    })

    it('sums per hour keeping the hour dimension and sorting ascending', () => {
        const hours = marginalizeDayHour([...GRID].reverse(), 'hour')

        expect(hours.map((row) => row.hour)).toEqual([7, 8, 9])
        expect(hours.every((row) => row.day_of_week === null)).toBe(true)
        expect(hours[0].total_rides).toBe(6)  // 4 + 2 at hour 7
        expect(hours[1].total_rides).toBe(14) // 6 + 8 at hour 8
        expect(hours[2].total_rides).toBe(0)  // zero-ride bucket kept
        expect(hours[0].hours_count).toBe(4)  // 2 spine hours per day
    })

    it('re-derives averages with the backend formulas', () => {
        const [day0] = marginalizeDayHour(GRID, 'day_of_week')

        // duration / rides, distance / rides, distance / (duration / 3600)
        expect(day0.average_duration_seconds).toBeCloseTo(10800 / 10)
        expect(day0.average_distance_km).toBeCloseTo(36 / 10)
        expect(day0.average_speed_kmh).toBeCloseTo(36 / (10800 / 3600))
    })

    it('yields zero averages for zero-ride buckets and nulls the std fields', () => {
        const hours = marginalizeDayHour(GRID, 'hour')
        const idle = hours.find((row) => row.hour === 9)

        expect(idle.average_duration_seconds).toBe(0)
        expect(idle.average_distance_km).toBe(0)
        expect(idle.average_speed_kmh).toBe(0)
        expect(idle.rides_per_hour_std).toBeNull()
        expect(idle.average_speed_kmh_std).toBeNull()
    })

    it('returns an empty array for empty or missing input', () => {
        expect(marginalizeDayHour([], 'hour')).toEqual([])
        expect(marginalizeDayHour(null, 'day_of_week')).toEqual([])
    })
})

describe('sumFootprintTotals', () => {
    it('sums rides and distance over the daily rows', () => {
        const totals = sumFootprintTotals([
            { date: '2025-06-01', total_rides: 3, total_distance_km: 7.5 },
            { date: '2025-06-02', total_rides: 5, total_distance_km: 2.5 },
        ])
        expect(totals).toEqual({ total_rides: 8, total_distance_km: 10 })
    })

    it('returns zeros for empty or missing input', () => {
        expect(sumFootprintTotals([])).toEqual({ total_rides: 0, total_distance_km: 0 })
        expect(sumFootprintTotals(null)).toEqual({ total_rides: 0, total_distance_km: 0 })
    })
})
