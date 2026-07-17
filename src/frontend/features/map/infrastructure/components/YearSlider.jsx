// Ticks every 10 years keep the track legible regardless of the data range.
const TICK_INTERVAL_YEARS = 10

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
    const decadeTicks = []
    for (
        let year = Math.ceil(minYear / TICK_INTERVAL_YEARS) * TICK_INTERVAL_YEARS;
        year <= maxYear;
        year += TICK_INTERVAL_YEARS
    ) {
        decadeTicks.push(year)
    }

    return (
        <div className="year-slider">
            <span className="year-slider__label">Network year</span>
            <div className="year-slider__track">
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
                <div className="year-slider__ticks" aria-hidden="true">
                    {decadeTicks.map((year) => (
                        <span
                            key={year}
                            className={`year-slider__tick${year === Math.round(currentYear / TICK_INTERVAL_YEARS) * TICK_INTERVAL_YEARS ? ' is-active' : ''}`}
                            style={{ left: `${((year - minYear) / range) * 100}%` }}
                        >
                            <span className="year-slider__tick-line" />
                            <span className="year-slider__tick-label">{year}</span>
                        </span>
                    ))}
                </div>
            </div>
            <span className="year-slider__value">{currentYear}</span>
        </div>
    )
}
