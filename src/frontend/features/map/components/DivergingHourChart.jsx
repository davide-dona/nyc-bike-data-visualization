import { formatCompact, formatNumber } from '@/utils/numberFormat.js'
import { niceCeil } from '@/utils/math.js'

/**
 * CSS-only diverging bar chart: arrivals grow up from the midline,
 * departures grow down, sharing one nice-rounded axis.
 * @param {string} title - Section heading and aria label.
 * @param {Array<Object>} rows - Hourly rows with avg_incoming, avg_outgoing, hour, and label.
 * @returns The rendered diverging hour chart.
 */
export default function DivergingHourChart({ title, rows }) {
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
