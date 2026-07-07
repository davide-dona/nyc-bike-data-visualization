import { formatCount } from '@/utils/numberFormat.js'

/**
 * One labeled horizontal bar scaled against the list maximum.
 * @param {string} label - Row label.
 * @param {number} value - Row value.
 * @param {number} maxValue - Maximum value across the list, for scaling.
 * @param {string} tone - Visual tone modifier for the fill.
 * @returns The rendered bar row.
 */
export default function HorizontalBarRow({ label, value, maxValue, tone = 'neutral' }) {
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
