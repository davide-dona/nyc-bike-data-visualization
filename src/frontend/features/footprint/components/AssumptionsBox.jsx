import {
    COMPARISON_MODES,
    SUBSTITUTION_RATE,
    EXCLUDED_EFFECTS,
    EQUIVALENCE_FACTORS,
} from '../utils/emissionFactors.js'
import CitationLink from './CitationLink.jsx'

/**
 * Renders a source's citations inline as "(Label, Label)", each label a
 * separate clickable link with its own hover tooltip. Returns null when a
 * source has no citation (e.g. the zero-emission classic-bike figure).
 * @param {Array} cites - Citation objects ({ label, url, title, year, summary }).
 */
function Sources({ cites }) {
    if (!cites || cites.length === 0) return null
    return (
        <>
            {' ('}
            {cites.map((cite, index) => (
                <span key={cite.url}>
                    {index > 0 ? ', ' : ''}
                    <CitationLink cite={cite} />
                </span>
            ))}
            {')'}
        </>
    )
}

/**
 * Explicit list of every assumption behind the numbers on this page: emission
 * factors with their sources, the substitution-rate range, what the estimate
 * deliberately does not capture, and the everyday-equivalence conversions.
 * Every source is a clickable link with a hover summary (see CitationLink).
 */
export default function AssumptionsBox() {
    const lowPct = Math.round(SUBSTITUTION_RATE.low * 100)
    const highPct = Math.round(SUBSTITUTION_RATE.high * 100)

    return (
        <aside className="panel-frame footprint-assumptions">
            <p className="panel-frame__title">Assumptions, stated explicitly</p>
            <div className="footprint-assumptions__grid">
                <section>
                    <p className="footprint-assumptions__heading">Travel Emission Rates</p>
                    <p className="footprint-assumptions__text">
                        To calculate emissions, we use standard, real-world averages for each type of transport:
                    </p>
                    <ul className="footprint-assumptions__list">
                        {COMPARISON_MODES.map((mode) => (
                            <li key={mode.key}>
                                <strong>{mode.label}: {mode.gPerKm} g/km.</strong> {mode.source}
                                <Sources cites={mode.cites} />
                            </li>
                        ))}
                        <li>
                            <strong>Trees to absorb it: {EQUIVALENCE_FACTORS.trees.tonnesPerTree.toFixed(3)} t CO2 per tree.</strong> {EQUIVALENCE_FACTORS.trees.source}
                            <Sources cites={EQUIVALENCE_FACTORS.trees.cites} />
                        </li>
                        <li>
                            <strong>People's yearly CO2: {EQUIVALENCE_FACTORS.globalPerCapita.tonnesPerPerson} t CO2 per person.</strong> {EQUIVALENCE_FACTORS.globalPerCapita.source}
                            <Sources cites={EQUIVALENCE_FACTORS.globalPerCapita.cites} />
                        </li>
                        <li>
                            <strong>LED bulb-hours powered: {EQUIVALENCE_FACTORS.ledBulb.watts} W bulb, {EQUIVALENCE_FACTORS.ledBulb.kgCo2PerKwh} kg CO2 per kWh.</strong> {EQUIVALENCE_FACTORS.ledBulb.source}
                            <Sources cites={EQUIVALENCE_FACTORS.ledBulb.cites} />
                        </li>
                    </ul>
                </section>
                <section>
                    <p className="footprint-assumptions__heading">Car Replacement Range</p>
                    <p className="footprint-assumptions__text">
                        When people ride bikes, they aren't always replacing a car trip.
                        They might have otherwise walked, caught the bus, or stayed home.
                        That is why we show avoided CO2 as a range of possibilities, not a single, perfect number.
                        {' '}{SUBSTITUTION_RATE.source}
                        <Sources cites={SUBSTITUTION_RATE.cites} />
                    </p>
                    <p className="footprint-assumptions__heading">Calculation Exclusions</p>
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
