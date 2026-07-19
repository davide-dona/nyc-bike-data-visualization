/**
 * Slider control for the infrastructure layer's historical view: sets the network year shown on the map ("Present" at maxYear).
 * @param {number|null} value - Selected year, or null for the present network.
 * @param {Function} onChange - Called with the new year, or null when back at present.
 * @param {number} minYear - Earliest installation year in the data.
 * @param {number} maxYear - Current year.
 * @param {boolean} [disabled=false] - Whether the control is disabled.
 */
export default function YearSlider({ value, onChange, minYear, maxYear, disabled = false }) {
    const range = Math.max(1, maxYear - minYear)
    const currentYear = value ?? maxYear
    const progressPct = ((currentYear - minYear) / range) * 100

    return (
        <div className="year-slider">
            <span className="year-slider__label">Network year</span>
            <div className="year-slider__track">
                <span className="year-slider__bound" aria-hidden="true">{minYear}</span>
                <input
                    type="range"
                    className="range-slider year-slider__input"
                    style={{ '--year-slider-progress': `${progressPct}%` }}
                    min={minYear}
                    max={maxYear}
                    step={1}
                    value={currentYear}
                    disabled={disabled}
                    onChange={(event) => {
                        const year = Number(event.target.value)
                        onChange(year >= maxYear ? null : year)
                    }}
                    aria-label="Show the bike network as of a given year"
                />
                <span className="year-slider__bound" aria-hidden="true">{maxYear}</span>
            </div>
            <span className="year-slider__value">{currentYear}</span>
        </div>
    )
}
