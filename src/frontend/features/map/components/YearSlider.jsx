/**
 * Toolbar slider for the infrastructure layer's historical view: shows the
 * bike network as it stood at the end of the selected year. The maximum
 * position means "Present", i.e. every currently active route.
 * @param {number|null} value - Selected year, or null for the present network.
 * @param {Function} onChange - Called with the new year, or null when back at present.
 * @param {number} minYear - Earliest installation year in the data.
 * @param {number} maxYear - Current year.
 * @param {boolean} [disabled=false] - Whether the slider is disabled.
 */
export default function YearSlider({ value, onChange, minYear, maxYear, disabled = false }) {
    return (
        <label className="year-slider">
            <span className="year-slider__label">Network year</span>
            <input
                type="range"
                className="range-slider"
                min={minYear}
                max={maxYear}
                step={1}
                value={value ?? maxYear}
                disabled={disabled}
                onChange={(event) => {
                    const year = Number(event.target.value)
                    onChange(year >= maxYear ? null : year)
                }}
                aria-label="Show the bike network as of a given year"
            />
            <span className="year-slider__value">
                {value == null ? `Present (${maxYear})` : value}
            </span>
        </label>
    )
}
