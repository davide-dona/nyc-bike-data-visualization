import { useCallback, useMemo } from 'react'
import InsightFrame from '../../components/InsightFrame.jsx'
import InsightBarChart from '../../components/InsightBarChart.jsx'
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

/**
 * Insight frames for the infrastructure layer: segments installed and removed
 * per year (diverging bars) plus borough and facility-class breakdowns of the
 * year-filtered network.
 * @param {Object} insights - Infrastructure data slice (routes, yearFilteredRoutes, query status).
 * @param {number|null} selectedYear - Selected network year, null for present.
 * @param {Function} setSelectedYear - Sets the network year filter.
 * @param {{minYear: number, maxYear: number}} yearBounds - Year slider bounds.
 * @returns The rendered infrastructure insight frames.
 */
export default function InfrastructureInsights({ insights, selectedYear, setSelectedYear, yearBounds }) {
    const { routes, yearFilteredRoutes } = insights
    const status = insights

    const networkChanges = useMemo(
        () => aggregateNetworkChangesByYear(routes, yearBounds.maxYear),
        [routes, yearBounds.maxYear],
    )
    // Removed counts render as negative bars below the zero line.
    const changeGroups = useMemo(() => [
        { label: 'Installed', values: networkChanges.installed, color: BAR_SOLID },
        { label: 'Removed', values: networkChanges.removed.map((count) => -count), color: BAR_RUST },
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

    // Keep year ticks readable in mono: cap the tick count as history grows
    const yearLabelStep = Math.max(1, Math.ceil(networkChanges.labels.length / 16))
    const yearScopeNote = selectedYear == null ? `the present (${yearBounds.maxYear})` : String(selectedYear)

    return (
        <>
            <InsightFrame
                title="Segments installed and removed per year"
                note="Bars above the line count new segments, bars below count retired ones. Click a year to see the network as it stood then."
                status={status}
            >
                <InsightBarChart
                    labels={networkChanges.labels}
                    groups={changeGroups}
                    diverging
                    highlightLabel={String(selectedYear ?? yearBounds.maxYear)}
                    onBarClick={handleYearClick}
                    xAxisTitle="Year"
                    yAxisTitle="Segments"
                    xLabelStep={yearLabelStep}
                />
            </InsightFrame>
            <div className="map-insights__row">
                <InsightFrame
                    title="Segments by borough"
                    note={`Compares network size across boroughs as of ${yearScopeNote}.`}
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
                    note={`Shows how much of the network each protection level covers as of ${yearScopeNote}.`}
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
