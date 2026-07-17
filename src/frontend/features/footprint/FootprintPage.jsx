import useFootprintPageState from './hooks/useFootprintPageState.js'
import FootprintTiles from './components/FootprintTiles.jsx'
import FootprintEquivalents from './components/FootprintEquivalents.jsx'
import ModeComparisonBar from './components/ModeComparisonBar.jsx'
import CumulativeAvoidedBand from './components/CumulativeAvoidedBand.jsx'
import AssumptionsBox from './components/AssumptionsBox.jsx'
import SubstitutionRateControl from './components/SubstitutionRateControl.jsx'
import VisualizationGuide from '../../components/VisualizationGuide.jsx'
import { FOOTPRINT_GUIDE } from './utils/footprintGuide.js'

/**
 * Component for the green mobility page: ridden kilometres translated into
 * environmental terms, with the assumptions on the table.
 */
function FootprintPage({ filters = {} }) {
    const {
        substitutionRate,
        setSubstitutionRate,
        dailyStats,
        totals,
        loading: dailyLoading,
        error: dailyError,
        refetch: refetchDaily,
    } = useFootprintPageState(filters)

    return (
        <section className="page-card">
            <header className="page-card__header">
                <div className="page-card__heading">
                    <span className="page-card__eyebrow">Environmental Impact</span>
                    <h2 className="page-card__title">Turning pedal power into a healthier planet.</h2>
                    <p className="page-card__subtitle">
                        See how kilometers translate to the environment using realistic ranges and transparent math.                    </p>
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
                    loading={dailyLoading}
                    error={dailyError}
                    onRefetch={refetchDaily}
                />

                <FootprintEquivalents
                    totals={totals}
                    substitutionRate={substitutionRate}
                    loading={dailyLoading}
                    error={dailyError}
                    onRefetch={refetchDaily}
                />

                <div className="footprint-grid">
                    <ModeComparisonBar
                        totals={totals}
                        loading={dailyLoading}
                        error={dailyError}
                        onRefetch={refetchDaily}
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

                <VisualizationGuide {...FOOTPRINT_GUIDE} />
            </div>
        </section>
    )
}

export default FootprintPage
