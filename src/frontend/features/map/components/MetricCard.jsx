/**
 * One live-availability metric tile in the station sidebar.
 * @param {string} label - Metric name.
 * @param {string} value - Preformatted metric value.
 * @param {string|null} hint - Optional context line under the value.
 * @returns The rendered metric card.
 */
export default function MetricCard({ label, value, hint }) {
    return (
        <article className="infra-sidebar__metric-card">
            <span className="infra-sidebar__metric-label">{label}</span>
            <strong className="infra-sidebar__metric-value">{value}</strong>
            {hint ? <span className="infra-sidebar__metric-hint">{hint}</span> : null}
        </article>
    )
}
