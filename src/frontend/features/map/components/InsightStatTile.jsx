/**
 * One headline stat tile for the map insights panel: a big mono value with
 * a small uppercase label and an optional hint line.
 * @param {string} label - Short uppercase label under the value.
 * @param {string} value - Pre-formatted headline value.
 * @param {string} [hint] - Optional secondary hint below the label.
 * @returns The rendered stat tile.
 */
export default function InsightStatTile({ label, value, hint }) {
    return (
        <div className="map-insights__stat-tile">
            <span className="map-insights__stat-value">{value}</span>
            <span className="map-insights__stat-label">{label}</span>
            {hint && <span className="map-insights__stat-hint">{hint}</span>}
        </div>
    )
}
