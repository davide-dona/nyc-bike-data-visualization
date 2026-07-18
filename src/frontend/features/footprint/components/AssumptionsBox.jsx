import {
    COMPARISON_MODES,
    SUBSTITUTION_RATE,
    EXCLUDED_EFFECTS,
    EQUIVALENCE_FACTORS,
} from '../utils/emissionFactors.js'
import { FOOTPRINT_TEXT } from '../utils/footprintText.js'
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
    return (
        <aside className="panel-frame footprint-assumptions">
            <p className="panel-frame__title">{FOOTPRINT_TEXT.assumptions.title}</p>
            <div className="footprint-assumptions__grid">
                <section>
                    <p className="footprint-assumptions__heading">{FOOTPRINT_TEXT.assumptions.emissionRatesHeading}</p>
                    <p className="footprint-assumptions__text">
                        {FOOTPRINT_TEXT.assumptions.emissionRatesIntro}
                    </p>
                    <ul className="footprint-assumptions__list">
                        {COMPARISON_MODES.map((mode) => (
                            <li key={mode.key}>
                                <strong>{mode.label}: {mode.gPerKm} g/km.</strong> {mode.source}
                                <Sources cites={mode.cites} />
                            </li>
                        ))}
                        <li>
                            <strong>Trees' yearly uptake: {EQUIVALENCE_FACTORS.trees.tonnesPerTreePerYear.toFixed(3)} t CO2 per tree per year.</strong> {EQUIVALENCE_FACTORS.trees.source}
                            <Sources cites={EQUIVALENCE_FACTORS.trees.cites} />
                        </li>
                        <li>
                            <strong>People's yearly CO2: {EQUIVALENCE_FACTORS.globalPerCapita.tonnesPerPerson} t CO2 per person.</strong> {EQUIVALENCE_FACTORS.globalPerCapita.source}
                            <Sources cites={EQUIVALENCE_FACTORS.globalPerCapita.cites} />
                        </li>
                        <li>
                            <strong>LED bulbs for a year: {EQUIVALENCE_FACTORS.ledBulb.watts} W bulb, {EQUIVALENCE_FACTORS.ledBulb.kgCo2PerKwh} kg CO2 per kWh.</strong> {EQUIVALENCE_FACTORS.ledBulb.source}
                            <Sources cites={EQUIVALENCE_FACTORS.ledBulb.cites} />
                        </li>
                    </ul>
                </section>
                <section>
                    <p className="footprint-assumptions__heading">{FOOTPRINT_TEXT.assumptions.carReplacementHeading}</p>
                    <p className="footprint-assumptions__text">
                        {FOOTPRINT_TEXT.assumptions.carReplacementText}
                        <Sources cites={SUBSTITUTION_RATE.cites} />
                    </p>
                    <p className="footprint-assumptions__heading">{FOOTPRINT_TEXT.assumptions.exclusionsHeading}</p>
                    <p className="footprint-assumptions__text">
                        {FOOTPRINT_TEXT.assumptions.exclusionsIntro}
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
