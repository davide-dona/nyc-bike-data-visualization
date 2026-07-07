import { useCallback, useMemo } from 'react'
import StatusMessage from '../../../components/StatusMessage.jsx'
import InsightBarChart from './InsightBarChart.jsx'
import {
    aggregateInstallationsByYear,
    aggregatePeakHourDistribution,
    aggregateRoutesByBorough,
    aggregateRoutesByFacilityClass,
    topCorridors,
    topPartnersByFlow,
    topStationsByUsage,
} from './insightSelectors.js'
import {
    FACILITY_CSS_COLORS,
    FACILITY_LABELS,
} from '../utils/bikeRoutesLayer.js'
import { BAR_SOLID, BAR_NEUTRAL } from '../../../utils/styling'
import { LIMIT_STATIONS, LIMIT_TRIPS_OVERVIEW } from '../../../utils/config.jsx'

const HOURS_IN_DAY = 24

const USAGE_MODE_NOTES = {
    all: 'all rides',
    incoming: 'incoming rides only',
    outgoing: 'outgoing rides only',
}

/**
 * One chart frame: a panel-frame with a title, the plot area, an optional
 * mono caption, and its own StatusMessage overlay so a failed query dims
 * this frame only - never the map above it.
 */
function InsightFrame({ title, note, status, emptyMessage, tall = false, children }) {
    const showStatus = Boolean(status?.loading || status?.error)
    const showEmpty = Boolean(emptyMessage) && !showStatus

    return (
        <div className="panel-frame">
            <p className="panel-frame__title">{title}</p>
            <div className={`map-insights__plot${tall ? ' map-insights__plot--tall' : ''}`}>
                {showEmpty
                    ? <div className="map-insights__empty">{emptyMessage}</div>
                    : children}
                {showStatus && (
                    <StatusMessage loading={status.loading} error={status.error} onRefetch={status.refetch} />
                )}
            </div>
            {note && <p className="map-insights__note">{note}</p>}
        </div>
    )
}

function InfrastructureInsights({ insights, selectedYear, setSelectedYear, yearBounds }) {
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

function StationUsageInsights({ insights, usageMode, currentTime }) {
    const { stations } = insights
    const status = insights

    const peakHours = useMemo(
        () => aggregatePeakHourDistribution(stations, usageMode),
        [stations, usageMode],
    )
    const busiestStations = useMemo(
        () => topStationsByUsage(stations, usageMode, 10),
        [stations, usageMode],
    )

    const wheelHour = ((Math.floor(currentTime) % HOURS_IN_DAY) + HOURS_IN_DAY) % HOURS_IN_DAY
    const modeNote = USAGE_MODE_NOTES[usageMode] ?? USAGE_MODE_NOTES.all

    return (
        <div className="map-insights__row">
            <InsightFrame
                title="Stations by peak hour"
                note={`The amber bar follows the map's time wheel. Counting ${modeNote}.`}
                status={status}
            >
                <InsightBarChart
                    labels={peakHours.labels}
                    values={peakHours.values}
                    highlightLabel={String(wheelHour)}
                    xAxisTitle="Hour of Day"
                    yAxisTitle="Stations peaking"
                    xLabelStep={3}
                />
            </InsightFrame>
            <InsightFrame
                title="Busiest stations"
                note={`Top 10 of the ${LIMIT_STATIONS} busiest stations fetched for the current filters. Counting ${modeNote}.`}
                status={status}
            >
                <InsightBarChart
                    horizontal
                    labels={busiestStations.labels}
                    values={busiestStations.values}
                    xAxisTitle="Avg rides / day"
                />
            </InsightFrame>
        </div>
    )
}

function TripFlowInsights({ insights }) {
    const { trips, isFocusView, focusedStationName } = insights
    const status = insights

    const corridors = useMemo(() => topCorridors(trips, 10), [trips])
    const partners = useMemo(() => topPartnersByFlow(trips, 10), [trips])
    // Inbound bars grow left of the zero line, outbound bars grow right.
    const divergingGroups = useMemo(() => [
        { label: 'Inbound', values: partners.inbound.map((value) => -value), color: BAR_NEUTRAL },
        { label: 'Outbound', values: partners.outbound, color: BAR_SOLID },
    ], [partners])

    if (isFocusView) {
        return (
            <InsightFrame
                title={`Corridors of ${focusedStationName ?? 'the focused station'}`}
                note="Partners ranked by combined flow. Inbound rides grow left, outbound rides grow right, averaged per day. Click the station again or press Reset for the citywide view."
                status={status}
                emptyMessage={partners.labels.length === 0
                    ? 'No trips recorded for the focused station with the current filters.'
                    : null}
                tall
            >
                <InsightBarChart
                    horizontal
                    diverging
                    labels={partners.labels}
                    groups={divergingGroups}
                    xAxisTitle="Avg daily rides"
                />
            </InsightFrame>
        )
    }

    return (
        <InsightFrame
            title="Strongest corridors citywide"
            note={`Top ${LIMIT_TRIPS_OVERVIEW} corridors drawn on the map, top 10 charted. Click a station to focus its own corridors.`}
            status={status}
            emptyMessage={corridors.labels.length === 0
                ? 'No trips recorded for the current filters.'
                : null}
            tall
        >
            <InsightBarChart
                horizontal
                labels={corridors.labels}
                values={corridors.values}
                xAxisTitle="Avg daily rides"
            />
        </InsightFrame>
    )
}

/**
 * Layer-aware insights block under the map: renders 1-3 chart frames whose
 * content follows the active layer, aggregating only data the map layers
 * already hold client-side.
 * @param {string} activeLayer - The map's active layer key.
 * @param {Object} insights - Per-layer data slices from useBuildLayers.
 * @param {string} usageMode - Station usage mode ('all' | 'incoming' | 'outgoing').
 * @param {number} currentTime - Current time-wheel hour (fractional during animation).
 * @param {number|null} selectedYear - Selected network year, null for present.
 * @param {Function} setSelectedYear - Sets the network year filter.
 * @param {{minYear: number, maxYear: number}} yearBounds - Year slider bounds.
 */
export default function MapInsightsPanel({
    activeLayer,
    insights,
    usageMode,
    currentTime,
    selectedYear,
    setSelectedYear,
    yearBounds,
}) {
    return (
        <div className="map-insights">
            {activeLayer === 'infrastructure' && (
                <InfrastructureInsights
                    insights={insights.infrastructure}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    yearBounds={yearBounds}
                />
            )}
            {activeLayer === 'station_usage' && (
                <StationUsageInsights
                    insights={insights.stationUsage}
                    usageMode={usageMode}
                    currentTime={currentTime}
                />
            )}
            {activeLayer === 'trip_flow' && (
                <TripFlowInsights insights={insights.tripFlow} />
            )}
        </div>
    )
}
