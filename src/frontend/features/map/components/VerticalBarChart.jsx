import { formatCompact, formatNumber } from '@/utils/numberFormat.js'
import { niceCeil } from '../utils/stationSidebarSelectors.js'

/**
 * CSS-only vertical bar chart with a nice-rounded y axis, used for the
 * sidebar's per-day and per-hour ride profiles.
 * @param {string} title - Section heading and aria label.
 * @param {Array<Object>} rows - Data rows; each needs the label/value keys plus an optional tooltip_label.
 * @param {string} labelKey - Row key used for React keys and label thinning.
 * @param {string} valueKey - Row key holding the bar value.
 * @param {string} unit - Unit appended to the hover tooltip.
 * @returns The rendered vertical bar chart.
 */
export default function VerticalBarChart({ title, rows, labelKey, valueKey, unit }) {
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
