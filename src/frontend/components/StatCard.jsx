const VALUE_SIZE_CLASS = {
    sm: 'stat-card__value--sm',
    md: 'stat-card__value--md',
    lg: 'stat-card__value--lg',
}

/**
 * Shared headline stat tile: a big value with a small uppercase label and an
 * optional hint line, used across the map insights panel, the infrastructure
 * sidebar, and the footprint page.
 * @param {string} value - Pre-formatted headline value.
 * @param {string} label - Short uppercase label under the value.
 * @param {string} [hint] - Optional secondary hint line.
 * @param {'light'|'dark'} [theme='light'] - Light (paper) or dark (inverted) surface.
 * @param {'sm'|'md'|'lg'} [size='md'] - Value text size.
 * @returns The rendered stat card.
 */
export default function StatCard({ value, label, hint, theme = 'light', size = 'md' }) {
    const isDark = theme === 'dark'
    return (
        <div className={`stat-card${isDark ? ' stat-card--dark' : ''}`}>
            <span className={`stat-card__value ${VALUE_SIZE_CLASS[size]}`}>{value}</span>
            <span className="stat-card__label">{label}</span>
            {hint ? <span className="stat-card__hint">{hint}</span> : null}
        </div>
    )
}
