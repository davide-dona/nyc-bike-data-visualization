import { describe, it, expect } from 'vitest'

import { filterRoutesByYear, getRouteYearBounds } from '../features/map/utils/routeYearFilter.js'

const route = (instDate, retiredDate = null) => ({ instDate, retiredDate })

const CURRENT_YEAR = new Date().getFullYear()

describe('filterRoutesByYear', () => {
    it('includes routes installed up to the last day of the target year', () => {
        const routes = [route('2010-12-31'), route('2011-01-01')]

        const active = filterRoutesByYear(routes, 2010)

        expect(active).toHaveLength(1)
        expect(active[0].instDate).toBe('2010-12-31')
    })

    it('keeps routes retired during the target year, drops earlier retirements', () => {
        const routes = [
            route('2000-06-01', '2010-01-01'), // retired on Jan 1 of Y: still active in Y
            route('2000-06-01', '2009-12-31'), // retired before Y started: gone
        ]

        const active = filterRoutesByYear(routes, 2010)

        expect(active).toHaveLength(1)
        expect(active[0].retiredDate).toBe('2010-01-01')
    })

    it('treats a null retiredDate as still active', () => {
        const routes = [route('2005-03-15', null)]

        expect(filterRoutesByYear(routes, 2010)).toHaveLength(1)
        expect(filterRoutesByYear(routes, 2004)).toHaveLength(0)
    })

    it('counts routes without an installation date as always installed', () => {
        const routes = [route(null), route(undefined)]

        expect(filterRoutesByYear(routes, 1950)).toHaveLength(2)
    })

    it('defaults to the current year when year is null', () => {
        const routes = [
            route('2000-01-01'),
            route('2000-01-01', `${CURRENT_YEAR - 1}-06-01`), // retired last year
        ]

        const active = filterRoutesByYear(routes, null)

        expect(active).toHaveLength(1)
        expect(active[0].retiredDate).toBeNull()
    })
})

describe('getRouteYearBounds', () => {
    it('spans the earliest installation year to the current year', () => {
        const routes = [route('2006-01-01'), route('1997-08-20'), route('2015-05-05')]

        expect(getRouteYearBounds(routes)).toEqual({ minYear: 1997, maxYear: CURRENT_YEAR })
    })

    it('ignores missing or unparseable installation dates', () => {
        const routes = [route(null), route('not-a-date'), route('2012-02-02')]

        expect(getRouteYearBounds(routes)).toEqual({ minYear: 2012, maxYear: CURRENT_YEAR })
    })

    it('collapses to the current year when no routes are loaded', () => {
        expect(getRouteYearBounds([])).toEqual({ minYear: CURRENT_YEAR, maxYear: CURRENT_YEAR })
    })
})
