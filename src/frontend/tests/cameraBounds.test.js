import { describe, it, expect } from 'vitest'

import { computeStationsBounds, fitViewForBounds, MAX_FIT_ZOOM } from '@/features/map/utils/cameraBounds.js'
import { MIN_ZOOM } from '@/features/map/utils/mapConfig.js'

const VIEWPORT = { width: 1200, height: 800 }

describe('computeStationsBounds', () => {
    it('returns null for empty or coordinate-less input', () => {
        expect(computeStationsBounds([])).toBeNull()
        expect(computeStationsBounds(null)).toBeNull()
        expect(computeStationsBounds([{ id: 'a' }])).toBeNull()
    })

    it('returns degenerate bounds for a single station', () => {
        const bounds = computeStationsBounds([{ longitude: -73.97, latitude: 40.75 }])
        expect(bounds).toEqual([[-73.97, 40.75], [-73.97, 40.75]])
    })

    it('spans all stations and skips invalid coordinates', () => {
        const bounds = computeStationsBounds([
            { longitude: -74.00, latitude: 40.70 },
            { longitude: -73.95, latitude: 40.80 },
            { longitude: Number.NaN, latitude: 40.75 },
        ])
        expect(bounds).toEqual([[-74.00, 40.70], [-73.95, 40.80]])
    })
})

describe('fitViewForBounds', () => {
    it('clamps the fitted zoom to the max ceiling for tight bounds', () => {
        const tight = [[-73.971, 40.750], [-73.970, 40.751]]
        const view = fitViewForBounds(tight, VIEWPORT)
        expect(view.zoom).toBe(MAX_FIT_ZOOM)
    })

    it('clamps the fitted zoom to the minimum for citywide bounds', () => {
        const wide = [[-74.60, 40.20], [-73.40, 41.20]]
        const view = fitViewForBounds(wide, VIEWPORT)
        expect(view.zoom).toBeGreaterThanOrEqual(MIN_ZOOM)
        expect(view.zoom).toBeLessThanOrEqual(MAX_FIT_ZOOM)
    })

    it('centers the view inside the bounds', () => {
        const bounds = [[-74.00, 40.70], [-73.90, 40.80]]
        const view = fitViewForBounds(bounds, VIEWPORT)
        expect(view.longitude).toBeGreaterThan(-74.00)
        expect(view.longitude).toBeLessThan(-73.90)
        expect(view.latitude).toBeGreaterThan(40.70)
        expect(view.latitude).toBeLessThan(40.80)
    })
})
