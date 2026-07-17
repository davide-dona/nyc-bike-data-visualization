import {
    COMPARISON_MODES,
    SUBSTITUTION_RATE,
    EXCLUDED_EFFECTS,
} from '../utils/emissionFactors.js'

/**
 * Explicit list of every assumption behind the numbers on this page: emission
 * factors with their sources, the substitution-rate range, and what the
 * estimate deliberately does not capture.
 */
export default function AssumptionsBox() {
    const lowPct = Math.round(SUBSTITUTION_RATE.low * 100)
    const highPct = Math.round(SUBSTITUTION_RATE.high * 100)

    return (
        <aside className="panel-frame footprint-assumptions">
            <p className="panel-frame__title">Assumptions, stated explicitly</p>
            <div className="footprint-assumptions__grid">
                <section>
                    <p className="footprint-assumptions__heading">Emission factors (g CO2e per km)</p>
                    <p className="footprint-assumptions__text">
                        To calculate emissions, we use standard, real-world averages for each type of transport:
                    </p>
                    <ul className="footprint-assumptions__list">
                        {COMPARISON_MODES.map((mode) => (
                            <li key={mode.key}>
                                <strong>{mode.label}: {mode.gPerKm} g/km.</strong> {mode.source}.
                            </li>
                        ))}
                    </ul>
                </section>
                <section>
                    <p className="footprint-assumptions__heading">Substitution rate ({lowPct}–{highPct}%)</p>
                    <p className="footprint-assumptions__text">
                        When people ride bikes, they aren't always replacing a car trip.
                        They might have otherwise walked, caught the bus, or stayed home.
                        That is why we show avoided $CO_2$ as a range of possibilities, not a single, perfect number.
                        {SUBSTITUTION_RATE.source}
                    </p>
                    <p className="footprint-assumptions__heading">What this estimate leaves out</p>
                    <p className="footprint-assumptions__text">
                        While we calculate direct travel savings, our current estimates do not account for the following factors:
                    </p>
                    <ul className="footprint-assumptions__list">
                        {EXCLUDED_EFFECTS.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </section>
            </div>
        </aside>
    )
}
