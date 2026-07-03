import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import StatusMessage from '../../../components/StatusMessage.jsx'
import SubstitutionRateControl from './SubstitutionRateControl.jsx'
import { SUBSTITUTION_RATE } from '../utils/emission_factors.js'
import { buildCumulativeAvoidedSeries } from '../utils/footprint_math.js'
import {
    ACCENT,
    INK_MUTED,
    PAPER_RAISED,
    RULE_STRONG,
    FONT_DISPLAY,
    FONT_MONO,
} from '../../../utils/editorialTokens.js'

const BAND_FILL = 'rgba(25, 83, 216, 0.14)'
const BAND_EDGE = 'rgba(25, 83, 216, 0.35)'

/**
 * Cumulative avoided-CO2 band over the selected period. The low/high envelope
 * from the literature substitution rates is the primary mark; the line at the
 * user-selected rate is deliberately secondary to it.
 * @param {Array} dailyStats - GroupedStats rows from /stats/?group_by=date
 * @param {number} substitutionRate - Selected car-substitution rate (fraction)
 * @param {Function} onSubstitutionRateChange - Setter for the selected rate
 * @param {boolean} loading - Whether data is loading
 * @param {Error|null} error - Fetch error
 * @param {Function} onRefetch - Callback to trigger a retry after error
 */
export default function CumulativeAvoidedBand({
    dailyStats,
    substitutionRate,
    onSubstitutionRateChange,
    loading,
    error,
    onRefetch,
}) {
    const series = useMemo(
        () => buildCumulativeAvoidedSeries(dailyStats, substitutionRate),
        [dailyStats, substitutionRate],
    )
    const hasData = series.dates.length > 0
    const ratePct = Math.round(substitutionRate * 100)
    const lowPct = Math.round(SUBSTITUTION_RATE.low * 100)
    const highPct = Math.round(SUBSTITUTION_RATE.high * 100)

    const traces = useMemo(() => [
        {
            type: 'scatter',
            mode: 'lines',
            name: `Low (${lowPct}%)`,
            x: series.dates,
            y: series.low,
            line: { color: BAND_EDGE, width: 1 },
            hovertemplate: `Low (${lowPct}%): <b>%{y:,.2f}</b> t<extra></extra>`,
        },
        {
            type: 'scatter',
            mode: 'lines',
            name: `High (${highPct}%)`,
            x: series.dates,
            y: series.high,
            line: { color: BAND_EDGE, width: 1 },
            fill: 'tonexty',
            fillcolor: BAND_FILL,
            hovertemplate: `High (${highPct}%): <b>%{y:,.2f}</b> t<extra></extra>`,
        },
        {
            type: 'scatter',
            mode: 'lines',
            name: `At ${ratePct}%`,
            x: series.dates,
            y: series.mid,
            line: { color: ACCENT, width: 1.6, dash: 'dot' },
            hovertemplate: `At ${ratePct}%: <b>%{y:,.2f}</b> t<extra></extra>`,
        },
    ], [series, ratePct, lowPct, highPct])

    return (
        <div className="footprint-frame">
            <p className="footprint-frame__title">Cumulative CO2 avoided, low/high band</p>
            <div className="footprint-plot">
                {hasData ? (
                    <Plot
                        data={traces}
                        layout={{
                            paper_bgcolor: PAPER_RAISED,
                            plot_bgcolor: PAPER_RAISED,
                            separators: ".'",
                            margin: { l: 52, r: 16, t: 8, b: 40 },
                            showlegend: true,
                            legend: {
                                orientation: 'h',
                                yanchor: 'bottom',
                                y: 1.02,
                                xanchor: 'left',
                                x: 0,
                                font: { family: FONT_MONO, size: 10, color: INK_MUTED },
                            },
                            hovermode: 'x unified',
                            xaxis: {
                                type: 'date',
                                title: {
                                    text: 'Date',
                                    font: { family: FONT_DISPLAY, size: 11, color: INK_MUTED },
                                },
                                tickfont: { family: FONT_MONO, size: 10, color: INK_MUTED },
                                gridcolor: 'transparent',
                                zerolinecolor: RULE_STRONG,
                            },
                            yaxis: {
                                title: {
                                    text: 't CO2e avoided (cumulative)',
                                    font: { family: FONT_DISPLAY, size: 11, color: INK_MUTED },
                                },
                                tickfont: { family: FONT_MONO, size: 10, color: INK_MUTED },
                                rangemode: 'tozero',
                                zerolinecolor: RULE_STRONG,
                            },
                            hoverlabel: {
                                bgcolor: 'rgba(11, 12, 14, 0.94)',
                                bordercolor: 'rgba(25, 83, 216, 0.72)',
                                align: 'left',
                                namelength: -1,
                                font: { family: FONT_MONO, size: 11, color: '#fbf8f2' },
                            },
                        }}
                        config={{
                            displayModeBar: false,
                            scrollZoom: false,
                        }}
                        className="w-full h-full"
                    />
                ) : (
                    <div className="footprint-empty">No daily stats available for this selection.</div>
                )}
                {(loading || error) && (
                    <StatusMessage loading={loading} error={error} onRefetch={onRefetch} />
                )}
            </div>
            <SubstitutionRateControl
                value={substitutionRate}
                onChange={onSubstitutionRateChange}
                disabled={loading || Boolean(error)}
            />
        </div>
    )
}
