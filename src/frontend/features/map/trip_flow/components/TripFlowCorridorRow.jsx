import { BAR_SOLID, BAR_RUST } from '@/utils/styling'
import { formatDailyRides } from '../utils/tripFlowFormat.js'

/**
 * One ranked corridor row: rank, label, an inline bar scaled to the list max, and the daily-rides value.
 * In split mode the fill is two-tone (outbound accent, inbound rust) showing each partner's direction balance.
 * Row hover highlights the matching map arc (and vice versa); a row click pins/unpins its corridor.
 * @param {Object} row - Ranked corridor from rankCorridors.
 * @param {number} rank - 1-based position in the list.
 * @param {number} maxValue - Maximum row value, for bar scaling.
 * @param {boolean} isHovered - Whether this corridor is highlighted.
 * @param {boolean} isPinned - Whether this corridor is pinned on the map.
 * @param {Function} onHover - Receives the corridor key on enter, null on leave.
 * @param {Function} onToggle - Receives the corridor key on click, toggling the pin.
 * @param {boolean} showSplit - Whether to render the outbound/inbound split fill.
 * @returns The rendered corridor row.
 */
export default function TripFlowCorridorRow({ row, rank, maxValue, isHovered, isPinned, onHover, onToggle, showSplit }) {
    const width = maxValue > 0 ? Math.max(2, (row.value / maxValue) * 100) : 0
    const total = row.outbound + row.inbound
    const outboundShare = total > 0 ? (row.outbound / total) * 100 : 0
    const label = showSplit ? row.endName : `${row.startName} ↔ ${row.endName}`
    const rowClass = [
        'trip-corridors__row',
        isHovered ? 'trip-corridors__row--hovered' : '',
        isPinned ? 'trip-corridors__row--pinned' : '',
    ].filter(Boolean).join(' ')

    return (
        <li
            className={rowClass}
            role="button"
            tabIndex={0}
            aria-pressed={isPinned}
            onMouseEnter={() => onHover(row.key)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onToggle(row.key)}
            onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                onToggle(row.key)
            }}
        >
            <span className="trip-corridors__rank">{rank}</span>
            <span className="trip-corridors__label" title={`${row.startName} ↔ ${row.endName}`}>
                {label}
            </span>
            <span className="trip-corridors__track" aria-hidden="true">
                {showSplit ? (
                    <span className="trip-corridors__fill trip-corridors__fill--split" style={{ width: `${width}%` }}>
                        <span style={{ width: `${outboundShare}%`, background: BAR_SOLID }} />
                        <span style={{ flex: 1, background: BAR_RUST }} />
                    </span>
                ) : (
                    <span className="trip-corridors__fill" style={{ width: `${width}%`, background: BAR_SOLID }} />
                )}
            </span>
            <span className="trip-corridors__value">{formatDailyRides(row.value)}</span>
        </li>
    )
}
