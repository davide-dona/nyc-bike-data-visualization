import { SUBSTITUTION_RATE } from '../utils/emissionFactors.js'

const MIN_PCT = Math.round(SUBSTITUTION_RATE.low * 100)
const MAX_PCT = Math.round(SUBSTITUTION_RATE.high * 100)

/**
 * Slider for the assumed share of rides that replace a car trip. Bounded by
 * the literature low/high rates so the selection always stays inside the band.
 * @param {number} value - Current substitution rate (fraction)
 * @param {Function} onChange - Called with the new rate (fraction)
 */
export default function SubstitutionRateControl({ value, onChange, disabled = false }) {
    const pct = Math.round(value * 100)

    return (
        <label className="footprint-rate">
            <span className="footprint-rate__label">Car-substitution rate</span>
            <input
                type="range"
                className="range-slider"
                min={MIN_PCT}
                max={MAX_PCT}
                step={1}
                value={pct}
                disabled={disabled}
                onChange={(event) => onChange(Number(event.target.value) / 100)}
                aria-label="Car-substitution rate in percent"
            />
            <span className="footprint-rate__value">{pct}%</span>
        </label>
    )
}
