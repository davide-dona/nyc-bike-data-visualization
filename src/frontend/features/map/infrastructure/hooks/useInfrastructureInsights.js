import { useCallback, useMemo } from 'react'
import {
    aggregateNetworkChangesByYear,
    aggregateRoutesByBorough,
    aggregateRoutesByFacilityClass,
} from '../../utils/insightSelectors.js'
import {
    FACILITY_CSS_COLORS,
    FACILITY_LABELS,
} from '../utils/bikeRoutesLayer.js'
import { BAR_SOLID, BAR_RUST } from '@/utils/styling'
import { INFRASTRUCTURE_TEXT } from '../utils/infrastructureText.js'

/**
 * Handler hook for the infrastructure insight frames: derives the per-year
 * network-change bars, the borough and facility-class breakdowns, and the
 * year-click handler plus note text for the selected network year.
 * @param {Object} params
 * @param {Object} params.insights - Infrastructure data slice (routes, yearFilteredRoutes, query status).
 * @param {number|null} params.selectedYear - Selected network year, null for present.
 * @param {Function} params.setSelectedYear - Sets the network year filter.
 * @param {{minYear: number, maxYear: number}} params.yearBounds - Year slider bounds.
 * @returns {Object} status, chart series/labels/colors, handleYearClick, yearLabelStep, and the borough/facility note text.
 */
export default function useInfrastructureInsights({ insights, selectedYear, setSelectedYear, yearBounds }) {
    const { routes, yearFilteredRoutes } = insights

    const networkChanges = useMemo(
        () => aggregateNetworkChangesByYear(routes, yearBounds.maxYear),
        [routes, yearBounds.maxYear],
    )
    // Removed counts render as negative bars below the zero line.
    const changeGroups = useMemo(() => [
        { label: INFRASTRUCTURE_TEXT.networkChanges.installedLabel, values: networkChanges.installed, color: BAR_SOLID },
        { label: INFRASTRUCTURE_TEXT.networkChanges.removedLabel, values: networkChanges.removed.map((count) => -count), color: BAR_RUST },
    ], [networkChanges])
    const byBorough = useMemo(() => aggregateRoutesByBorough(yearFilteredRoutes), [yearFilteredRoutes])
    const byFacilityClass = useMemo(() => aggregateRoutesByFacilityClass(yearFilteredRoutes), [yearFilteredRoutes])

    const facilityLabels = useMemo(
        () => byFacilityClass.classes.map((cls) => FACILITY_LABELS[cls] ?? FACILITY_LABELS._default),
        [byFacilityClass],
    )
    const facilityColors = useMemo(
        () => byFacilityClass.classes.map((cls) => FACILITY_CSS_COLORS[cls] ?? FACILITY_CSS_COLORS._default),
        [byFacilityClass],
    )

    // Clicking a year filters like the slider; re-clicking it (or the current year) returns to present.
    const handleYearClick = useCallback((_index, label) => {
        const year = Number(label)
        if (!Number.isFinite(year)) return
        const activeYear = selectedYear ?? yearBounds.maxYear
        setSelectedYear(year === activeYear || year >= yearBounds.maxYear ? null : year)
    }, [selectedYear, setSelectedYear, yearBounds.maxYear])

    // Keep year ticks readable in mono: cap the tick count as history grows.
    const yearLabelStep = Math.max(1, Math.ceil(networkChanges.labels.length / 16))
    const yearScopeNote = selectedYear == null
        ? `${INFRASTRUCTURE_TEXT.yearScope.presentLead}${yearBounds.maxYear}${INFRASTRUCTURE_TEXT.yearScope.presentTail}`
        : String(selectedYear)
    const boroughNote = INFRASTRUCTURE_TEXT.borough.noteLead + yearScopeNote + INFRASTRUCTURE_TEXT.borough.noteTail
    const facilityNote = INFRASTRUCTURE_TEXT.facility.noteLead + yearScopeNote + INFRASTRUCTURE_TEXT.facility.noteTail

    return {
        status: insights,
        networkChanges,
        changeGroups,
        byBorough,
        byFacilityClass,
        facilityLabels,
        facilityColors,
        handleYearClick,
        yearLabelStep,
        boroughNote,
        facilityNote,
    }
}
