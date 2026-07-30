/**
 * Renders a single legend row: swatch + label + optional hint.
 * When `onToggle` is provided the row becomes an on/off visibility button.
 * @param {string} swatch - CSS color/gradient used for the legend swatch background.
 * @param {string} label - Human-readable label for the legend entry.
 * @param {string} [hint] - Optional secondary hint text shown alongside the label.
 * @param {Function} [onToggle] - Optional callback making the row a toggle button.
 * @param {boolean} [isHidden] - Whether the row's category is currently hidden on the map.
 * @returns {JSX.Element} List item representing one legend entry.
 */
export default function LegendRow({ swatch, label, hint, onToggle, isHidden = false }) {
    const content = (
        <>
            <span className="map-legend__swatch" style={{ background: swatch }} />
            <span className="map-legend__label">{label}</span>
            {hint && <span className="map-legend__hint">{hint}</span>}
        </>
    );

    if (!onToggle) {
        return <li className="map-legend__row">{content}</li>;
    }

    return (
        <li className={`map-legend__row${isHidden ? ' map-legend__row--hidden' : ''}`}>
            <button
                type="button"
                className="map-legend__row-toggle"
                aria-pressed={!isHidden}
                onClick={onToggle}
                title={isHidden ? `Show ${label}` : `Hide ${label}`}
            >
                {content}
            </button>
        </li>
    );
}
