import { formatCount } from '@/utils/numberFormat.js'

/**
 * One labeled horizontal bar scaled against the list maximum. Renders as a
 * button when `onSelect` is provided, so the row can drive station selection
 * (e.g. the infrastructure sidebar's leaderboard).
 * @param {string} label - Row label.
 * @param {number} value - Row value.
 * @param {number} maxValue - Maximum value across the list, for scaling.
 * @param {string} tone - Visual tone modifier for the fill.
 * @param {Function} [onSelect] - Called on click/activation; renders the row as a button when set.
 * @returns The rendered bar row.
 */
export default function HorizontalBarRow({ label, value, maxValue, tone = 'neutral', onSelect }) {
    const width = maxValue > 0 ? Math.max(2, (value / maxValue) * 100) : 0
    const content = (
        <>
            <span className="infra-sidebar__bar-label">{label}</span>
            <div className="infra-sidebar__bar-track" aria-hidden="true">
                <div className={`infra-sidebar__bar-fill tone-${tone}`} style={{ width: `${width}%` }} />
            </div>
            <span className="infra-sidebar__bar-value">{formatCount(value)}</span>
        </>
    )

    if (onSelect) {
        return (
            <button type="button" className="infra-sidebar__bar-row infra-sidebar__bar-row--interactive" onClick={onSelect}>
                {content}
            </button>
        )
    }

    return (
        <div className="infra-sidebar__bar-row">
            {content}
        </div>
    )
}
