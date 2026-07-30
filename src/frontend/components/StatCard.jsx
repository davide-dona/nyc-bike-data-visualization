const VALUE_SIZE_CLASS = {
    sm: 'stat-card__value--sm',
    md: 'stat-card__value--md',
    lg: 'stat-card__value--lg',
}

/** Shared headline stat tile: big value, small uppercase label, optional hint line — used in the map insights panel, infrastructure sidebar, and footprint page. */
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
