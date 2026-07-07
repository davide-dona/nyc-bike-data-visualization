/**
 * One month cell in the date window picker grid.
 * @param {number} monthIdx - Zero-based month index (unused visually, kept for callers).
 * @param {string} label - Month label shown in the cell.
 * @param {boolean} disabled - Whether the cell is unavailable for selection.
 * @param {'start'|'end'|'middle'|null} shade - Range shading role of the cell.
 * @param {Function} onClick - Click handler (ignored while disabled).
 * @param {boolean} active - Whether the cell is part of the selected range.
 * @returns The rendered month cell.
 */
export default function MonthCell({ monthIdx, label, disabled, shade, onClick, active }) {
    const className = [
        'dw-month-cell',
        disabled ? ' disabled' : '',
        shade === 'start' ? ' shade-start' : '',
        shade === 'end' ? ' shade-end' : '',
        shade === 'middle' ? ' shade-mid' : '',
        active ? ' active' : '',
    ].join('')

    return (
        <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            className={className}
            onClick={(e) => { if (disabled) return; onClick?.(e) }}
        >
            {label}
        </div>
    )
}
