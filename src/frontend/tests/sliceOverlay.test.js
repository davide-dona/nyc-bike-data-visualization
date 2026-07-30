import { describe, it, expect } from 'vitest'

import { buildLayerSliceOverlays, buildSliceOverlay } from '@/features/temporal/utils/sliceOverlay.js'

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

const OTHER_DAY_HOUR_FIXTURE = [
    { day_of_week: 0, hour: 8, total_rides: 60 },
    { day_of_week: 3, hour: 8, total_rides: 30 },
]

describe('buildLayerSliceOverlays', () => {
    it('builds one series per layer, keyed to the same slice', () => {
        const overlay = buildLayerSliceOverlays(
            [
                { label: 'Current: All · All', color: '#111', dayHourStats: DAY_HOUR_FIXTURE },
                { label: 'Member · All', color: '#222', dayHourStats: OTHER_DAY_HOUR_FIXTURE },
            ],
            { type: 'hour', index: 8 },
            getTotalRides,
        )

        expect(overlay.target).toBe('day')
        expect(overlay.label).toBe('Hour 08')
        expect(overlay.series).toHaveLength(2)
        expect(overlay.series[0].data[0]).toBe(120)
        expect(overlay.series[1].data[0]).toBe(60)
        expect(overlay.series[1].color).toBe('#222')
    })

    it('names series by layer only while several layers are shown', () => {
        const layers = [
            { label: 'Current: All · All', color: '#111', dayHourStats: DAY_HOUR_FIXTURE },
            { label: 'Member · All', color: '#222', dayHourStats: OTHER_DAY_HOUR_FIXTURE },
        ]
        const single = buildLayerSliceOverlays(layers.slice(0, 1), { type: 'day', index: 0 }, getTotalRides)
        const multi = buildLayerSliceOverlays(layers, { type: 'day', index: 0 }, getTotalRides)

        expect(single.series[0].label).toBe('Monday')
        expect(multi.series[0].label).toBe('Current: All · All · Monday')
        expect(multi.series[1].label).toBe('Member · All · Monday')
    })

    it('skips layers without a day-hour grid and returns null when none remain', () => {
        const pin = { type: 'day', index: 0 }
        const partial = buildLayerSliceOverlays(
            [
                { label: 'Loading', color: '#111', dayHourStats: undefined },
                { label: 'Member · All', color: '#222', dayHourStats: OTHER_DAY_HOUR_FIXTURE },
            ],
            pin,
            getTotalRides,
        )

        expect(partial.series).toHaveLength(1)
        expect(partial.series[0].label).toBe('Monday')
        expect(buildLayerSliceOverlays([{ label: 'Loading' }], pin, getTotalRides)).toBeNull()
        expect(buildLayerSliceOverlays([], pin, getTotalRides)).toBeNull()
        expect(buildLayerSliceOverlays(null, pin, getTotalRides)).toBeNull()
    })

    it('returns null when nothing is pinned', () => {
        const layers = [{ label: 'Current: All · All', color: '#111', dayHourStats: DAY_HOUR_FIXTURE }]

        expect(buildLayerSliceOverlays(layers, null, getTotalRides)).toBeNull()
    })
})
