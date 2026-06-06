import { useMemo } from 'react'
import useInfrastructureStationSidebarData from '../layers/infrastructure_layer/stations/useInfrastructureStationSidebarData.js'

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatPercent(value) {
    if (!Number.isFinite(value)) return '0%'
    return `${Math.round(value * 100)}%`
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
            <span className="infra-sidebar__bar-value">{value.toLocaleString()}</span>
        </div>
    )
}

function VerticalBarChart({ title, rows, labelKey, valueKey }) {
    const maxValue = Math.max(1, ...rows.map((row) => Number(row?.[valueKey] ?? 0)))
    return (
        <section className="infra-sidebar__chart-block">
            <div className="infra-sidebar__section-heading">{title}</div>
            <div className="infra-sidebar__vbars" role="img" aria-label={title}>
                {rows.map((row) => {
                    const value = Number(row?.[valueKey] ?? 0)
                    const height = Math.max(6, (value / maxValue) * 100)
                    return (
                        <div key={row[labelKey]} className="infra-sidebar__vbar-wrap">
                            <div className="infra-sidebar__vbar-track">
                                <div className="infra-sidebar__vbar-fill" style={{ height: `${height}%` }} />
                            </div>
                            <span className="infra-sidebar__vbar-label">{rows.length > 12 && row[labelKey] % 2 !== 0 ? '⋅' : row.label}</span>
                        </div>
                    )
                })}
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
        acc.totalBikes += Number(station.num_bikes_available ?? (station.classicalBikes ?? 0) + (station.electricBikes ?? 0))
        acc.classicBikes += Number(station.classicalBikes ?? 0)
        acc.electricBikes += Number(station.electricBikes ?? 0)
        acc.availableDocks += Number(station.available_docks ?? 0)
        acc.disabledBikes += Number(station.num_bikes_disabled ?? 0)
        acc.stationHealth += Number(station.station_health ?? 0)
        return acc
    }, {
        actualCapacity: 0,
        totalBikes: 0,
        classicBikes: 0,
        electricBikes: 0,
        availableDocks: 0,
        disabledBikes: 0,
        stationHealth: 0,
    })

    const avgHealth = selectedStations.length > 0 ? liveTotals.stationHealth / selectedStations.length : 0

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
                            : 'Live availability plus historical ride and flow statistics for this station.'}
                    </p>
                </div>
                <button type="button" className="infra-sidebar__close" onClick={onClose} aria-label="Close station sidebar">
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
            </div>

            <section className="infra-sidebar__metrics-grid">
                <MetricCard label="Stations" value={selectedStations.length} hint={isGrouped ? 'grouped selection' : primaryStation.id} />
                <MetricCard label="Capacity" value={liveTotals.actualCapacity.toLocaleString()} hint="effective docks" />
                <MetricCard label="Bikes" value={liveTotals.totalBikes.toLocaleString()} hint={`${liveTotals.classicBikes} classic, ${liveTotals.electricBikes} electric`} />
                <MetricCard label="Docks" value={liveTotals.availableDocks.toLocaleString()} hint="available now" />
                <MetricCard label="Disabled" value={liveTotals.disabledBikes.toLocaleString()} hint="out of service" />
                <MetricCard label="Health" value={formatPercent(avgHealth)} hint="mean station health" />
                {!stationData.loading && !stationData.error && <MetricCard label="Rides" value={stationData.totals.totalRides.toLocaleString()} hint="historical rides in range" />}
            </section>

            {!stationData.loading && !stationData.error && <section className="infra-sidebar__section">
                <div className="infra-sidebar__section-heading">Historical profile</div>
                <div className="infra-sidebar__chart-grid">
                    <VerticalBarChart title="By day of week" rows={stationData.daySeries.map((row) => ({ ...row, label: DAY_ORDER[row.day_of_week] ?? row.label }))} labelKey="day_of_week" valueKey="total_rides" />
                    <VerticalBarChart title="By hour" rows={stationData.hourSeries} labelKey="hour" valueKey="total_rides" />
                </div>
            </section>}

            {stationData.loading && <div className="infra-sidebar__loading">Loading station statistics…</div>}
            {stationData.error && <div className="infra-sidebar__error">{stationData.error}</div>}
        </aside>
    )
}
