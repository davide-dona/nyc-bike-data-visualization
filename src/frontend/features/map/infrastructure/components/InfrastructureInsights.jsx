import InsightFrame from '../../components/InsightFrame.jsx'
import InsightBarChart from '../../components/InsightBarChart.jsx'
import useInfrastructureInsights from '../hooks/useInfrastructureInsights.js'
import { INFRASTRUCTURE_TEXT } from '../utils/infrastructureText.js'

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
    const {
        status,
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
    } = useInfrastructureInsights({ insights, selectedYear, setSelectedYear, yearBounds })

    return (
        <>
            <InsightFrame
                title={INFRASTRUCTURE_TEXT.networkChanges.title}
                note={INFRASTRUCTURE_TEXT.networkChanges.note}
                status={status}
            >
                <InsightBarChart
                    labels={networkChanges.labels}
                    groups={changeGroups}
                    diverging
                    highlightLabel={String(selectedYear ?? yearBounds.maxYear)}
                    onBarClick={handleYearClick}
                    xAxisTitle={INFRASTRUCTURE_TEXT.networkChanges.xAxisTitle}
                    yAxisTitle={INFRASTRUCTURE_TEXT.networkChanges.yAxisTitle}
                    xLabelStep={yearLabelStep}
                />
            </InsightFrame>
            <div className="map-insights__row">
                <InsightFrame
                    title={INFRASTRUCTURE_TEXT.borough.title}
                    note={boroughNote}
                    status={status}
                >
                    <InsightBarChart
                        horizontal
                        labels={byBorough.labels}
                        values={byBorough.values}
                        xAxisTitle={INFRASTRUCTURE_TEXT.borough.xAxisTitle}
                    />
                </InsightFrame>
                <InsightFrame
                    title={INFRASTRUCTURE_TEXT.facility.title}
                    note={facilityNote}
                    status={status}
                >
                    <InsightBarChart
                        horizontal
                        labels={facilityLabels}
                        values={byFacilityClass.values}
                        colors={facilityColors}
                        xAxisTitle={INFRASTRUCTURE_TEXT.facility.xAxisTitle}
                    />
                </InsightFrame>
            </div>
        </>
    )
}
