import { useCallback, useMemo } from 'react'
import InsightFrame from './InsightFrame.jsx'
import InsightBarChart from './InsightBarChart.jsx'
import {
    aggregateInstallationsByYear,
    aggregateRoutesByBorough,
    aggregateRoutesByFacilityClass,
} from '../utils/insightSelectors.js'
import {
    FACILITY_CSS_COLORS,
    FACILITY_LABELS,
} from '../utils/bikeRoutesLayer.js'

/**
 * Insight frames for the infrastructure layer: installations per year plus
 * borough and facility-class breakdowns of the year-filtered network.
 * @param {Object} insights - Infrastructure data slice (routes, yearFilteredRoutes, query status).
 * @param {number|null} selectedYear - Selected network year, null for present.
 * @param {Function} setSelectedYear - Sets the network year filter.
 * @param {{minYear: number, maxYear: number}} yearBounds - Year slider bounds.
 * @returns The rendered infrastructure insight frames.
 */
export default function InfrastructureInsights({ insights, selectedYear, setSelectedYear, yearBounds }) {
    const { routes, yearFilteredRoutes } = insights
    const status = insights

    const installations = useMemo(
        () => aggregateInstallationsByYear(routes, yearBounds.maxYear),
        [routes, yearBounds.maxYear],
    )
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

    // Clicking a year filters the map like the year slider; clicking the
    // already-selected year (or the current one) returns to the present.
    const handleYearClick = useCallback((_index, label) => {
        const year = Number(label)
        if (!Number.isFinite(year)) return
        const activeYear = selectedYear ?? yearBounds.maxYear
        setSelectedYear(year === activeYear || year >= yearBounds.maxYear ? null : year)
    }, [selectedYear, setSelectedYear, yearBounds.maxYear])

    // Keep year ticks readable in mono: cap the tick count as history grows
    const yearLabelStep = Math.max(1, Math.ceil(installations.labels.length / 16))
    const yearScopeNote = selectedYear == null ? `the present (${yearBounds.maxYear})` : String(selectedYear)

    return (
        <>
            <InsightFrame
                title="Segments installed per year"
                note="Click a year to filter the map. Full network history shown, retired segments included."
                status={status}
            >
                <InsightBarChart
                    labels={installations.labels}
                    values={installations.values}
                    highlightLabel={String(selectedYear ?? yearBounds.maxYear)}
                    onBarClick={handleYearClick}
                    xAxisTitle="Year"
                    yAxisTitle="Segments installed"
                    xLabelStep={yearLabelStep}
                />
            </InsightFrame>
            <div className="map-insights__row">
                <InsightFrame
                    title="Segments by borough"
                    note={`Network as of ${yearScopeNote}.`}
                    status={status}
                >
                    <InsightBarChart
                        horizontal
                        labels={byBorough.labels}
                        values={byBorough.values}
                        xAxisTitle="Segments"
                    />
                </InsightFrame>
                <InsightFrame
                    title="Segments by facility class"
                    note={`Colors mirror the map legend. Network as of ${yearScopeNote}.`}
                    status={status}
                >
                    <InsightBarChart
                        horizontal
                        labels={facilityLabels}
                        values={byFacilityClass.values}
                        colors={facilityColors}
                        xAxisTitle="Segments"
                    />
                </InsightFrame>
            </div>
        </>
    )
}
