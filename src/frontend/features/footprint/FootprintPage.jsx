import { useState } from 'react'
import useFootprintTotals from './hooks/useFootprintTotals.js'
import useFootprintDaily from './hooks/useFootprintDaily.js'
import FootprintTiles from './components/FootprintTiles.jsx'
import ModeComparisonBar from './components/ModeComparisonBar.jsx'
import CumulativeAvoidedBand from './components/CumulativeAvoidedBand.jsx'
import AssumptionsBox from './components/AssumptionsBox.jsx'
import SubstitutionRateControl from './components/SubstitutionRateControl.jsx'
import VisualizationGuide from '../../components/VisualizationGuide.jsx'
import { SUBSTITUTION_RATE } from './utils/emission_factors.js'

/**
 * Component for the green mobility page: ridden kilometres translated into
 * environmental terms, with the assumptions on the table.
 * @param {Object} filters - The filters to apply to the data, such as date range or user-selected filters.
 */
function FootprintPage({ filters = {} }) {
    // Assumed share of rides replacing a car trip; drives tiles and band alike
    const [substitutionRate, setSubstitutionRate] = useState(SUBSTITUTION_RATE.mid)
    // Each chart keeps its own query state; tiles and the comparison bar read the same totals
    const { totals, loading, error, refetch } = useFootprintTotals(filters)
    const {
        dailyStats,
        loading: dailyLoading,
        error: dailyError,
        refetch: refetchDaily,
    } = useFootprintDaily(filters)

    return (
        <section className="page-card">
            <header className="page-card__header">
                <div className="page-card__heading">
                    <span className="page-card__eyebrow">04 - Footprint</span>
                    <h2 className="page-card__title">The exhaust that never was.</h2>
                    <p className="page-card__subtitle">
                        Ridden kilometres translated into environmental terms - as a
                        range, never a single number, with every assumption stated.
                    </p>
                </div>
                <div className="page-card__actions">
                    <SubstitutionRateControl
                        value={substitutionRate}
                        onChange={setSubstitutionRate}
                        disabled={dailyLoading || Boolean(dailyError)}
                    />
                </div>
            </header>
            <div className="page-card__body">
                <FootprintTiles
                    totals={totals}
                    substitutionRate={substitutionRate}
                    loading={loading}
                    error={error}
                    onRefetch={refetch}
                />

                <div className="footprint-grid">
                    <ModeComparisonBar
                        totals={totals}
                        loading={loading}
                        error={error}
                        onRefetch={refetch}
                    />
                    <CumulativeAvoidedBand
                        dailyStats={dailyStats}
                        substitutionRate={substitutionRate}
                        loading={dailyLoading}
                        error={dailyError}
                        onRefetch={refetchDaily}
                    />
                </div>

                <AssumptionsBox />

                <VisualizationGuide
                    mapName="Footprint"
                    title="How To Read It"
                    summary="This view answers two different questions and keeps them apart: what would the same kilometres emit by other modes, and how much car CO2 did riding plausibly avoid. The first is a comparison, the second is an estimate - so it always comes as a range."
                    hints={[
                        {
                            title: 'Comparison is not avoidance',
                            text: 'The bar chart re-expresses the same travelled distance per mode. It does not claim riders would otherwise have driven - that claim lives in the band, discounted by the substitution rate.',
                        },
                        {
                            title: 'Trust the band, not the line',
                            text: 'The shaded envelope spans the plausible substitution rates from the literature. The dotted line is only your chosen point inside it - move the slider and watch how much the outcome depends on that assumption.',
                        },
                        {
                            title: 'Check the assumptions',
                            text: 'Every emission factor, the substitution range, and what the estimate leaves out are listed below the charts. If you disagree with an input, the box tells you exactly which number to challenge.',
                        },
                    ]}
                />
            </div>
        </section>
    )
}

export default FootprintPage
