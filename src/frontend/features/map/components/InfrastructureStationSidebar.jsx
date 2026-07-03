import { useMemo } from 'react'
import useInfrastructureStationSidebarData from '../layers/infrastructure_layer/stations/useInfrastructureStationSidebarData.js'
import { formatCompact, formatCount, formatNumber } from '../../../utils/numberFormat.js'

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays']

// Round up to 1/2/5 × 10^k so axis ticks land on clean values
function niceCeil(value) {
    if (!Number.isFinite(value) || value <= 0) return 1
    const base = Math.pow(10, Math.floor(Math.log10(value)))
    const norm = value / base
    const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
    return nice * base
}

function flowBalanceText({ pctDiff }) {
    const pct = Math.round(Math.abs(pctDiff) * 100)
    if (pct < 1) return 'Balanced in/out'
    return pctDiff > 0 ? `+${pct}% more departures` : `+${pct}% more arrivals`
}

function MetricCard({ label, value, hint }) {
    return (
        <article className="infra-sidebar__metric-card">
            <span className="infra-sidebar__metric-label">{label}</span>
            <strong className="infra-sidebar__metric-value">{value}</strong>
            {hint ? <span className="infra-sidebar__metric-hint">{hint}</span> : null}
        </article>
    )
}

function HorizontalBarRow({ label, value, maxValue, tone = 'neutral' }) {
    const width = maxValue > 0 ? Math.max(2, (value / maxValue) * 100) : 0
    return (
        <div className="infra-sidebar__bar-row">
            <span className="infra-sidebar__bar-label">{label}</span>
            <div className="infra-sidebar__bar-track" aria-hidden="true">
                <div className={`infra-sidebar__bar-fill tone-${tone}`} style={{ width: `${width}%` }} />
            </div>
            <span className="infra-sidebar__bar-value">{formatCount(value)}</span>
        </div>
    )
}

function VerticalBarChart({ title, rows, labelKey, valueKey, unit }) {
    const axisMax = niceCeil(Math.max(...rows.map((row) => Number(row?.[valueKey] ?? 0)), 0))
    return (
        <section className="infra-sidebar__chart-block">
            <div className="infra-sidebar__section-heading">{title}</div>
            <div className="infra-sidebar__chart-body">
                <div className="infra-sidebar__y-axis" aria-hidden="true">
                    <span className="infra-sidebar__y-tick">{formatCompact(axisMax)}</span>
                    <span className="infra-sidebar__y-tick">{formatCompact(axisMax / 2)}</span>
                    <span className="infra-sidebar__y-tick">0</span>
                </div>
                <div className="infra-sidebar__chart-area">
                    <div className="infra-sidebar__gridlines" aria-hidden="true">
                        <span /><span /><span />
                    </div>
                    <div className="infra-sidebar__vbars" role="img" aria-label={title}>
                        {rows.map((row) => {
                            const value = Number(row?.[valueKey] ?? 0)
                            const height = (value / axisMax) * 100
                            return (
                                <div key={row[labelKey]} className="infra-sidebar__vbar-wrap" title={`${row.tooltip_label ?? row.label} - ${formatNumber(value, 2)} ${unit}`}>
                                    <div className="infra-sidebar__vbar-track">
                                        <div className="infra-sidebar__vbar-fill" style={{ height: `${height}%` }} />
                                    </div>
                                    <span className="infra-sidebar__vbar-label">{rows.length > 12 && row[labelKey] % 2 !== 0 ? '⋅' : row.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}

function characterHint(label) {
    if (label === 'Workplace-like') return 'AM arrivals · PM departures'
    if (label === 'Residential-like') return 'AM departures · PM arrivals'
    return null
}

function DivergingHourChart({ title, rows }) {
    const axisMax = niceCeil(Math.max(...rows.map((row) => Math.max(Number(row?.avg_incoming ?? 0), Number(row?.avg_outgoing ?? 0))), 0))
    return (
        <section className="infra-sidebar__chart-block">
            <div className="infra-sidebar__section-heading">{title}</div>
            <div className="infra-sidebar__chart-caption" aria-hidden="true">
                <span className="infra-sidebar__chart-caption-swatch tone-accent" /> arrivals
                <span className="infra-sidebar__chart-caption-swatch" /> departures
            </div>
            <div className="infra-sidebar__chart-body">
                <div className="infra-sidebar__y-axis" aria-hidden="true">
                    <span className="infra-sidebar__y-tick">{formatCompact(axisMax)}</span>
                    <span className="infra-sidebar__y-tick">0</span>
                    <span className="infra-sidebar__y-tick">{formatCompact(axisMax)}</span>
                </div>
                <div className="infra-sidebar__chart-area">
                    <div className="infra-sidebar__gridlines" aria-hidden="true">
                        <span /><span /><span />
                    </div>
                    <div className="infra-sidebar__vbars" role="img" aria-label={title}>
                        {rows.map((row) => {
                            const incoming = Number(row?.avg_incoming ?? 0)
                            const outgoing = Number(row?.avg_outgoing ?? 0)
                            return (
                                <div key={row.hour} className="infra-sidebar__vbar-wrap" title={`${row.label}:00 - in ${formatNumber(incoming, 2)}/h · out ${formatNumber(outgoing, 2)}/h`}>
                                    <div className="infra-sidebar__dvbar-track">
                                        <div className="infra-sidebar__dvbar-top">
                                            <div className="infra-sidebar__dvbar-fill tone-accent" style={{ height: `${(incoming / axisMax) * 100}%` }} />
                                        </div>
                                        <div className="infra-sidebar__dvbar-midline" />
                                        <div className="infra-sidebar__dvbar-bottom">
                                            <div className="infra-sidebar__dvbar-fill" style={{ height: `${(outgoing / axisMax) * 100}%` }} />
                                        </div>
                                    </div>
                                    <span className="infra-sidebar__vbar-label">{rows.length > 12 && row.hour % 2 !== 0 ? '⋅' : row.label}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </section>
    )
}

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

    const todayDow = (new Date().getDay() + 6) % 7
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
