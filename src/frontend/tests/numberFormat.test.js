import { describe, it, expect } from 'vitest'

import { formatNumber, formatCount, formatCompact } from '../utils/numberFormat.js'

describe('formatNumber', () => {
    it('groups thousands with apostrophes and rounds to the requested decimals', () => {
        expect(formatNumber(12345.678)).toBe("12'345.68")
        expect(formatNumber(12345.678, 1)).toBe("12'345.7")
        expect(formatNumber(1234567.891, 2)).toBe("1'234'567.89")
    })

    it('pads to the requested decimals for small values', () => {
        expect(formatNumber(3, 2)).toBe('3.00')
        expect(formatNumber(0.5, 2)).toBe('0.50')
    })

    it('returns "-" for non-finite input', () => {
        expect(formatNumber(NaN)).toBe('-')
        expect(formatNumber(Infinity)).toBe('-')
        expect(formatNumber(undefined)).toBe('-')
        expect(formatNumber(null)).toBe('-')
    })
})

describe('formatCount', () => {
    it('groups integers without decimals', () => {
        expect(formatCount(8513752)).toBe("8'513'752")
        expect(formatCount(999)).toBe('999')
        expect(formatCount(1234.6)).toBe("1'235")
    })

    it('returns "-" for non-finite input', () => {
        expect(formatCount(NaN)).toBe('-')
    })
})

describe('formatCompact', () => {
    it('uses lowercase k and at most one fraction digit', () => {
        expect(formatCompact(2000)).toBe('2k')
        expect(formatCompact(2300)).toBe('2.3k')
        expect(formatCompact(22282082)).toBe('22.3M')
        expect(formatCompact(950)).toBe('950')
    })

    it('returns "-" for non-finite input', () => {
        expect(formatCompact(NaN)).toBe('-')
    })
})
