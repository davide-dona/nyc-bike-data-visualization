import { describe, it, expect } from 'vitest'
import { clamp, haversineKm, niceCeil } from '@/utils/math.js'
import { toRgba } from '@/utils/color.js'
import { formatIsoDate, lastDayOfMonth } from '@/utils/dateFormat.js'
import { clampTooltipToViewport } from '@/utils/tooltipPosition.js'

describe('math utils', () => {
    it('clamp keeps values inside the range', () => {
        expect(clamp(5, 0, 10)).toBe(5)
        expect(clamp(-3, 0, 10)).toBe(0)
        expect(clamp(42, 0, 10)).toBe(10)
    })

    it('niceCeil rounds up to 1/2/5 x 10^k', () => {
        expect(niceCeil(3)).toBe(5)
        expect(niceCeil(7)).toBe(10)
        expect(niceCeil(12)).toBe(20)
        expect(niceCeil(200)).toBe(200)
        expect(niceCeil(0.7)).toBe(1)
    })

    it('niceCeil returns 1 for empty or invalid maxima', () => {
        expect(niceCeil(0)).toBe(1)
        expect(niceCeil(-5)).toBe(1)
        expect(niceCeil(NaN)).toBe(1)
    })

    it('haversineKm matches a known NYC distance', () => {
        // Columbus Circle to Union Square is about 3.66 km great-circle
        expect(haversineKm(40.7681, -73.9819, 40.7359, -73.9911)).toBeCloseTo(3.66, 1)
        expect(haversineKm(40.7, -73.9, 40.7, -73.9)).toBe(0)
    })
})

describe('color utils', () => {
    it('toRgba expands 6-digit hex colors', () => {
        expect(toRgba('#1953d8', 0.5)).toBe('rgba(25, 83, 216, 0.5)')
    })

    it('toRgba expands 3-digit hex colors', () => {
        expect(toRgba('#fff', 1)).toBe('rgba(255, 255, 255, 1)')
    })

    it('toRgba falls back to accent blue on malformed input', () => {
        expect(toRgba('bogus', 0.3)).toBe('rgba(25, 83, 216, 0.3)')
        expect(toRgba(undefined, 0.3)).toBe('rgba(25, 83, 216, 0.3)')
    })
})

describe('date format utils', () => {
    it('formatIsoDate zero-pads local dates', () => {
        expect(formatIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
        expect(formatIsoDate(new Date(2026, 11, 31))).toBe('2026-12-31')
    })

    it('lastDayOfMonth handles month lengths and leap years', () => {
        expect(lastDayOfMonth(2026, 0)).toBe(31)
        expect(lastDayOfMonth(2026, 3)).toBe(30)
        expect(lastDayOfMonth(2026, 1)).toBe(28)
        expect(lastDayOfMonth(2024, 1)).toBe(29)
    })
})

describe('tooltip position utils', () => {
    it('keeps an in-bounds tooltip untouched', () => {
        window.innerWidth = 1000
        window.innerHeight = 800
        expect(clampTooltipToViewport({ x: 100, y: 100, width: 200, height: 50 }))
            .toEqual({ x: 100, y: 100 })
    })

    it('clamps to every viewport edge with the margin', () => {
        window.innerWidth = 1000
        window.innerHeight = 800
        expect(clampTooltipToViewport({ x: -50, y: -50, width: 200, height: 50, margin: 12 }))
            .toEqual({ x: 12, y: 12 })
        expect(clampTooltipToViewport({ x: 950, y: 790, width: 200, height: 50, margin: 12 }))
            .toEqual({ x: 1000 - 200 - 12, y: 800 - 50 - 12 })
    })

    it('pins oversized tooltips to the margin edge', () => {
        window.innerWidth = 300
        window.innerHeight = 200
        expect(clampTooltipToViewport({ x: 50, y: 50, width: 500, height: 400, margin: 12 }))
            .toEqual({ x: 12, y: 12 })
    })
})
