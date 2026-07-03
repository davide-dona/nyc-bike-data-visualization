import { describe, it, expect } from 'vitest'

import { buildSliceOverlay } from '../features/temporal/utils/slice_overlay.js'

const getTotalRides = (row) => row.total_rides

const DAY_HOUR_FIXTURE = [
    { day_of_week: 0, hour: 8, total_rides: 120 },
    { day_of_week: 0, hour: 17, total_rides: 200 },
    { day_of_week: 3, hour: 8, total_rides: 90 },
    { day_of_week: 6, hour: 8, total_rides: 40 },
]

describe('buildSliceOverlay', () => {
    it('builds a 24-slot hourly series for a pinned day, zero-filling missing cells', () => {
        const overlay = buildSliceOverlay(DAY_HOUR_FIXTURE, { type: 'day', index: 0 }, getTotalRides)

        expect(overlay.target).toBe('hour')
        expect(overlay.label).toBe('Monday')
        expect(overlay.data).toHaveLength(24)
        expect(overlay.data[8]).toBe(120)
        expect(overlay.data[17]).toBe(200)
        expect(overlay.data[0]).toBe(0)
        expect(overlay.data[23]).toBe(0)
    })

    it('builds a 7-slot daily series for a pinned hour, zero-filling missing cells', () => {
        const overlay = buildSliceOverlay(DAY_HOUR_FIXTURE, { type: 'hour', index: 8 }, getTotalRides)

        expect(overlay.target).toBe('day')
        expect(overlay.label).toBe('Hour 08')
        expect(overlay.data).toHaveLength(7)
        expect(overlay.data[0]).toBe(120)
        expect(overlay.data[3]).toBe(90)
        expect(overlay.data[6]).toBe(40)
        expect(overlay.data[1]).toBe(0)
    })

    it('zeroes non-finite metric values', () => {
        const rows = [{ day_of_week: 0, hour: 8, total_rides: NaN }]
        const overlay = buildSliceOverlay(rows, { type: 'day', index: 0 }, getTotalRides)

        expect(overlay.data[8]).toBe(0)
    })

    it('returns null for empty or missing input', () => {
        expect(buildSliceOverlay([], null, getTotalRides)).toBeNull()
        expect(buildSliceOverlay(null, { type: 'day', index: 0 }, getTotalRides)).toBeNull()
        expect(buildSliceOverlay([], { type: 'week', index: 0 }, getTotalRides)).toBeNull()
    })

    it('returns an all-zero series when the pinned slice has no rows', () => {
        const overlay = buildSliceOverlay(DAY_HOUR_FIXTURE, { type: 'day', index: 1 }, getTotalRides)

        expect(overlay.data).toHaveLength(24)
        expect(overlay.data.every((value) => value === 0)).toBe(true)
    })
})
