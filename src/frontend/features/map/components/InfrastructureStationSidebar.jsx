import { useMemo } from 'react'
import useInfrastructureStationSidebarData from '../hooks/useInfrastructureStationSidebarData.js'
import { formatCount, formatNumber } from '@/utils/numberFormat.js'
import MetricCard from './MetricCard.jsx'
import HorizontalBarRow from './HorizontalBarRow.jsx'
import VerticalBarChart from './VerticalBarChart.jsx'
import DivergingHourChart from './DivergingHourChart.jsx'
import {
    DAY_FULL,
    DAY_ORDER,
    characterHint,
    flowBalanceText,
    todayWeekdayIndex,
} from '../utils/stationSidebarSelectors.js'

/**
 * Slide-in sidebar for the infrastructure layer: live availability metrics,
 * historical highlights, day/hour ride profiles, and top connected stations
 * for the selected station(s).
 * @param {Array<Object>} selectedStations - Stations picked on the map (empty hides the sidebar).
 * @param {Object} filters - Active header filters forwarded to the stats fetch.
 * @param {Function} onClose - Clears the station selection.
 * @returns The rendered sidebar, or null when nothing is selected.
 */
export default function InfrastructureStationSidebar({ selectedStations = [], filters = {}, onClose }) {
    const stationIds = useMemo(() => selectedStations.map((station) => station.id), [selectedStations])
    const stationData = useInfrastructureStationSidebarData({ stationIds, filters })

    if (!selectedStations.length) return null

    const isGrouped = selectedStations.length > 1
    const primaryStation = selectedStations[0]
    const liveTotals = selectedStations.reduce((acc, station) => {
        acc.actualCapacity += Number(station.actual_capacity ?? station.capacity ?? 0)
        acc.classicBikes += Number(station.classicalBikes ?? 0)
        acc.electricBikes += Number(station.electricBikes ?? 0)
        acc.availableDocks += Number(station.available_docks ?? 0)
        acc.disabledBikes += Number(station.num_bikes_disabled ?? 0)
        return acc
    }, {
        actualCapacity: 0,
        classicBikes: 0,
        electricBikes: 0,
        availableDocks: 0,
        disabledBikes: 0,
    })

    const todayDow = todayWeekdayIndex()
    const todayRow = stationData.daySeries[todayDow]
    const { peakHour, busiestDay, netFlow, character } = stationData.summary
    const topFlows = stationData.topFlows.slice(0, 5)
    const maxFlowRides = topFlows[0]?.total_rides ?? 0

    return (
        <aside className={`infra-sidebar${selectedStations.length > 0 ? ' is-open' : ''}`} role="dialog" aria-label="Station details sidebar">
            <div className="infra-sidebar__header">
                <div>
                    <p className="infra-sidebar__eyebrow">Infrastructure</p>
                    <h3 className="infra-sidebar__title">
                        {isGrouped ? `${selectedStations.length} stations selected` : primaryStation.name}
                    </h3>
                    <p className="infra-sidebar__subtitle">
                        {isGrouped
                            ? 'Grouped station selection with aggregated live capacity and ride statistics.'
                            : `Station ${primaryStation.id} - live availability plus historical ride and flow statistics.`}
                    </p>
                </div>
                <button type="button" className="infra-sidebar__close" onClick={onClose} aria-label="Close station sidebar">
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
            </div>

            <section className="infra-sidebar__metrics-grid">
                <MetricCard label="Capacity" value={formatCount(liveTotals.actualCapacity)} hint="effective docks" />
                <MetricCard label="Docks" value={formatCount(liveTotals.availableDocks)} hint="available now" />
                <MetricCard label="Classic bikes" value={formatCount(liveTotals.classicBikes)} hint="available now" />
                <MetricCard label="E-bikes" value={formatCount(liveTotals.electricBikes)} hint="available now" />
                <MetricCard label="Disabled" value={formatCount(liveTotals.disabledBikes)} hint="out of service" />
            </section>

            {!stationData.loading && !stationData.error && <section className="infra-sidebar__section">
                <div className="infra-sidebar__section-heading">Highlights</div>
                <ul className="infra-sidebar__highlights">
                    <li className="infra-sidebar__highlight-row">
                        <span className="infra-sidebar__highlight-label">Avg {DAY_FULL[todayDow]}</span>
                        <strong className="infra-sidebar__highlight-value">~{formatNumber(todayRow.avg_rides, 2)} rides</strong>
                    </li>
                    <li className="infra-sidebar__highlight-row">
                        <span className="infra-sidebar__highlight-label">Peak hour</span>
                        <strong className="infra-sidebar__highlight-value">{peakHour.label}:00 (~{formatNumber(peakHour.avg_rides, 2)} rides/h)</strong>
                    </li>
                    <li className="infra-sidebar__highlight-row">
                        <span className="infra-sidebar__highlight-label">Busiest day</span>
                        <strong className="infra-sidebar__highlight-value">{DAY_FULL[busiestDay.day_of_week]} (~{formatNumber(busiestDay.avg_rides, 2)} rides)</strong>
                    </li>
                    <li className="infra-sidebar__highlight-row">
                        <span className="infra-sidebar__highlight-label">Flow balance</span>
                        <strong className="infra-sidebar__highlight-value">{flowBalanceText(netFlow)}</strong>
                    </li>
                    <li className="infra-sidebar__highlight-row">
                        <span className="infra-sidebar__highlight-label">Profile</span>
                        <strong className="infra-sidebar__highlight-value" title={characterHint(character.label) ?? undefined}>{character.label}</strong>
                    </li>
                </ul>
            </section>}

            {!stationData.loading && !stationData.error && <section className="infra-sidebar__section">
                <div className="infra-sidebar__section-heading">Historical profile</div>
                <div className="infra-sidebar__chart-grid">
                    <VerticalBarChart title="Avg rides by day of week" rows={stationData.daySeries.map((row) => ({ ...row, label: DAY_ORDER[row.day_of_week] ?? row.label }))} labelKey="day_of_week" valueKey="avg_rides" unit="avg rides" />
                    <VerticalBarChart title="Avg rides by hour" rows={stationData.hourSeries.map((row) => ({ ...row, tooltip_label: `${row.label}:00` }))} labelKey="hour" valueKey="avg_rides" unit="avg rides/h" />
                    <DivergingHourChart title="Avg in / out by hour" rows={stationData.hourSeries} />
                </div>
            </section>}

            {!stationData.loading && !stationData.error && topFlows.length > 0 && <section className="infra-sidebar__section">
                <div className="infra-sidebar__section-heading">Top connected stations</div>
                <div className="infra-sidebar__flow-list">
                    {topFlows.map((flow) => {
                        const partnerName = stationIds.includes(flow.station_a_id) ? flow.station_b_name : flow.station_a_name
                        return (
                            <HorizontalBarRow
                                key={`${flow.station_a_id}__${flow.station_b_id}`}
                                label={partnerName}
                                value={flow.total_rides}
                                maxValue={maxFlowRides}
                            />
                        )
                    })}
                </div>
            </section>}

            {stationData.loading && <div className="infra-sidebar__loading">Loading station statistics…</div>}
            {stationData.error && <div className="infra-sidebar__error">{stationData.error}</div>}
        </aside>
    )
}
