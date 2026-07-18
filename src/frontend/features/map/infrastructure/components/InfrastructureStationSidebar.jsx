import useInfrastructureStationSidebarData from '../hooks/useInfrastructureStationSidebarData.js'
import { formatCount, formatNumber } from '@/utils/numberFormat.js'
import { RIDE_METRIC_LABELS } from '@/utils/rideMetricLabels.js'
import StatCard from '@/components/StatCard.jsx'
import HorizontalBarRow from '../../components/HorizontalBarRow.jsx'
import VerticalBarChart from '../../components/VerticalBarChart.jsx'
import DivergingHourChart from '../../components/DivergingHourChart.jsx'
import {
    DAY_FULL,
    DAY_ORDER,
    characterHint,
    flowBalanceText,
    todayWeekdayIndex,
} from '../utils/stationSidebarSelectors.js'
import { INFRASTRUCTURE_TEXT } from '../utils/infrastructureText.js'

/**
 * Slide-in sidebar for the infrastructure layer: live availability metrics,
 * historical highlights, day/hour ride profiles, and top connected stations
 * for the selected station.
 * @param {Array<Object>} selectedStations - The selected station, as a 0-or-1-length array (empty hides the sidebar).
 * @param {Object} filters - Active header filters forwarded to the stats fetch.
 * @param {Function} onClose - Clears the station selection.
 * @param {Function} selectStation - Selects a station by id (used by the leaderboard rows).
 * @returns The rendered sidebar, or null when nothing is selected.
 */
export default function InfrastructureStationSidebar({ selectedStations = [], filters = {}, onClose, selectStation }) {
    const stationData = useInfrastructureStationSidebarData({ selectedStations, filters })

    if (!selectedStations.length) return null

    const primaryStation = selectedStations[0]
    const liveTotals = {
        actualCapacity: Number(primaryStation.actual_capacity ?? primaryStation.capacity ?? 0),
        classicBikes: Number(primaryStation.classicalBikes ?? 0),
        electricBikes: Number(primaryStation.electricBikes ?? 0),
        availableDocks: Number(primaryStation.available_docks ?? 0),
        disabledBikes: Number(primaryStation.num_bikes_disabled ?? 0),
    }
    const bikesAvailable = liveTotals.classicBikes + liveTotals.electricBikes

    const todayDow = todayWeekdayIndex()
    const todayRow = stationData.daySeries[todayDow]
    const { peakHour, busiestDay, netFlow, character } = stationData.summary
    const topFlows = stationData.topFlows.slice(0, 5)
    const maxFlowRides = topFlows[0]?.total_rides ?? 0

    return (
        <aside className={`infra-sidebar${selectedStations.length > 0 ? ' is-open' : ''}`} role="dialog" aria-label="Station details sidebar">
            <div className="infra-sidebar__header">
                <div>
                    <div className='flex justify-between items-center mb-1'>
                        <p className="infra-sidebar__eyebrow">{INFRASTRUCTURE_TEXT.sidebar.eyebrow}</p>
                        <button type="button" className="infra-sidebar__close" onClick={onClose} aria-label="Close station sidebar">
                            <i className="fa-solid fa-xmark" aria-hidden="true" />
                        </button>
                    </div>
                    <h3 className="infra-sidebar__title mt-5">
                        {primaryStation.name}
                    </h3>
                    <p className="infra-sidebar__subtitle">
                        {`Station ID ${primaryStation.id}: live availability plus historical ride and flow statistics per station.`}
                    </p>
                </div>

            </div>

            <section className="infra-sidebar__metrics-grid">
                <StatCard theme="dark" size="sm" label={INFRASTRUCTURE_TEXT.sidebar.metrics.capacity.label} value={formatCount(liveTotals.actualCapacity)} hint={INFRASTRUCTURE_TEXT.sidebar.metrics.capacity.hint} />
                <StatCard theme="dark" size="sm" label={INFRASTRUCTURE_TEXT.sidebar.metrics.docks.label} value={formatCount(liveTotals.availableDocks)} hint={INFRASTRUCTURE_TEXT.sidebar.metrics.docks.hint} />
                <StatCard theme="dark" size="sm" label={INFRASTRUCTURE_TEXT.sidebar.metrics.classicBikes.label} value={formatCount(liveTotals.classicBikes)} hint={INFRASTRUCTURE_TEXT.sidebar.metrics.classicBikes.hint} />
                <StatCard theme="dark" size="sm" label={INFRASTRUCTURE_TEXT.sidebar.metrics.electricBikes.label} value={formatCount(liveTotals.electricBikes)} hint={INFRASTRUCTURE_TEXT.sidebar.metrics.electricBikes.hint} />
                <StatCard theme="dark" size="sm" label={INFRASTRUCTURE_TEXT.sidebar.metrics.bikesAvailable.label} value={formatCount(bikesAvailable)} hint={INFRASTRUCTURE_TEXT.sidebar.metrics.bikesAvailable.hint} />
                <StatCard theme="dark" size="sm" label={INFRASTRUCTURE_TEXT.sidebar.metrics.disabled.label} value={formatCount(liveTotals.disabledBikes)} hint={INFRASTRUCTURE_TEXT.sidebar.metrics.disabled.hint} />
            </section>

            {!stationData.loading && !stationData.error && <section className="infra-sidebar__section">
                <div className="infra-sidebar__section-heading">{INFRASTRUCTURE_TEXT.sidebar.headings.highlights}</div>
                <ul className="infra-sidebar__highlights">
                    <li className="infra-sidebar__highlight-row">
                        <span className="infra-sidebar__highlight-label">Avg {DAY_FULL[todayDow]}</span>
                        <strong className="infra-sidebar__highlight-value">~{formatNumber(todayRow.avg_rides, 2)} {RIDE_METRIC_LABELS.perDay.unit}</strong>
                    </li>
                    <li className="infra-sidebar__highlight-row">
                        <span className="infra-sidebar__highlight-label">{INFRASTRUCTURE_TEXT.sidebar.highlightLabels.peakHour}</span>
                        <strong className="infra-sidebar__highlight-value">{peakHour.label}:00 (~{formatNumber(peakHour.avg_rides, 2)} {RIDE_METRIC_LABELS.perHour.unit})</strong>
                    </li>
                    <li className="infra-sidebar__highlight-row">
                        <span className="infra-sidebar__highlight-label">{INFRASTRUCTURE_TEXT.sidebar.highlightLabels.busiestDay}</span>
                        <strong className="infra-sidebar__highlight-value">{DAY_FULL[busiestDay.day_of_week]} (~{formatNumber(busiestDay.avg_rides, 2)} {RIDE_METRIC_LABELS.perDay.unit})</strong>
                    </li>
                    <li className="infra-sidebar__highlight-row">
                        <span className="infra-sidebar__highlight-label">{INFRASTRUCTURE_TEXT.sidebar.highlightLabels.flowBalance}</span>
                        <strong className="infra-sidebar__highlight-value">{flowBalanceText(netFlow)}</strong>
                    </li>
                    <li className="infra-sidebar__highlight-row">
                        <span className="infra-sidebar__highlight-label">{INFRASTRUCTURE_TEXT.sidebar.highlightLabels.profile}</span>
                        <strong className="infra-sidebar__highlight-value" title={characterHint(character.label) ?? undefined}>{character.label}</strong>
                    </li>
                </ul>
            </section>}

            {!stationData.loading && !stationData.error && <section className="infra-sidebar__section">
                <div className="infra-sidebar__section-heading">{INFRASTRUCTURE_TEXT.sidebar.headings.historicalProfile}</div>
                <div className="infra-sidebar__chart-grid">
                    <VerticalBarChart title={INFRASTRUCTURE_TEXT.sidebar.chartTitles.byDayOfWeek} rows={stationData.daySeries.map((row) => ({ ...row, label: DAY_ORDER[row.day_of_week] ?? row.label }))} labelKey="day_of_week" valueKey="avg_rides" unit={RIDE_METRIC_LABELS.perDay.unit} />
                    <VerticalBarChart title={INFRASTRUCTURE_TEXT.sidebar.chartTitles.byHour} rows={stationData.hourSeries.map((row) => ({ ...row, tooltip_label: `${row.label}:00` }))} labelKey="hour" valueKey="avg_rides" unit={RIDE_METRIC_LABELS.perHour.unit} />
                    <DivergingHourChart title={INFRASTRUCTURE_TEXT.sidebar.chartTitles.inOutByHour} rows={stationData.hourSeries} />
                </div>
            </section>}

            {!stationData.loading && !stationData.error && topFlows.length > 0 && <section className="infra-sidebar__section">
                <div className="infra-sidebar__section-heading infra-sidebar__section-heading--metric">
                    <span>{INFRASTRUCTURE_TEXT.sidebar.headings.topConnected}</span>
                    <span className="infra-sidebar__section-metric">{RIDE_METRIC_LABELS.total.label}</span>
                </div>
                <div className="infra-sidebar__flow-list">
                    {topFlows.map((flow) => {
                        const isPrimaryA = stationData.stationIds.includes(flow.station_a_id)
                        const partnerName = isPrimaryA ? flow.station_b_name : flow.station_a_name
                        const partnerId = isPrimaryA ? flow.station_b_id : flow.station_a_id
                        return (
                            <HorizontalBarRow
                                key={`${flow.station_a_id}__${flow.station_b_id}`}
                                label={partnerName}
                                value={flow.total_rides}
                                maxValue={maxFlowRides}
                                onSelect={() => selectStation(partnerId)}
                            />
                        )
                    })}
                </div>
            </section>}

            {stationData.loading && <div className="infra-sidebar__loading">{INFRASTRUCTURE_TEXT.sidebar.loading}</div>}
            {stationData.error && <div className="infra-sidebar__error">{stationData.error}</div>}
        </aside>
    )
}
