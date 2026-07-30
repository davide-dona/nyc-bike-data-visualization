import { useMemo, useState } from 'react'
import {
    FONT_MONO,
    INK,
    INK_MUTED,
    PAPER_RAISED,
    RULE,
    FONT_SANS,
    RULE_STRONG,
} from '@/utils/editorialTokens.js'
import { WMO_WEATHER_CODES } from '../utils/wmoCodeHandler.js'
import { PLOTLY_HOVERLABEL } from '@/utils/styling'
import { toRgba } from '@/utils/color.js'
import { RIDE_METRIC_LABELS } from '@/utils/rideMetricLabels.js'
import {
    buildRidgelineSeries,
    buildTickText,
    wrapLabel,
} from '../utils/weatherRidgeline.js'
import { WEATHER_TEXT } from '../utils/weatherText.js'

/**
 * Handler hook for the weather ridgeline: owns the hour/day-of-week dimension toggle and derives the Plotly traces, layout, note and tick labels.
 * @param {Object} params
 * @param {Array} params.data - Weather stats rows grouped by day_of_week and hour.
 * @returns {Object} dimension state, Plotly traces and layout, hasData flag, and the assembled note text.
 */
export default function useWeatherRidgeline({ data }) {
    const [dimension, setDimension] = useState('hour')

    const ridges = useMemo(() => buildRidgelineSeries(data ?? [], dimension), [data, dimension])

    const traces = useMemo(
        () =>
            ridges.flatMap((ridge) => {
                const baselineTrace = {
                    type: 'scatter',
                    mode: 'lines',
                    x: ridge.x,
                    y: ridge.x.map(() => ridge.baseline),
                    line: { color: 'rgba(0,0,0,0)', width: 0 },
                    hoverinfo: 'skip',
                    showlegend: false,
                }

                const ridgeTrace = {
                    type: 'scatter',
                    mode: 'lines',
                    x: ridge.x,
                    y: ridge.y,
                    name: ridge.label,
                    line: {
                        color: ridge.color,
                        width: 1.5,
                        shape: 'spline',
                        smoothing: 0.5,
                    },
                    fill: 'tonexty',
                    fillcolor: toRgba(ridge.color, 0.24),
                    hovertemplate:
                        `<b>${ridge.label}</b><br>` +
                        (dimension === 'hour'
                            ? 'Moment: <b>%{x:02d}:00</b><br>'
                            : 'Moment: <b>%{x}</b><br>') +
                        `${dimension === 'hour' ? RIDE_METRIC_LABELS.perHour.label : RIDE_METRIC_LABELS.perDay.label}: <b>%{customdata:,.2f}</b><extra></extra>`,
                    customdata: ridge.rawSeries,
                    showlegend: false,
                }

                return [baselineTrace, ridgeTrace]
            }),
        [ridges, dimension],
    )

    const yTickValues = ridges.map((ridge) => ridge.baseline + 0.38)
    const yTickText = ridges.map((r) =>
        wrapLabel(
            (WMO_WEATHER_CODES[r.code] ?? `WMO ${r.code}`)
                .replace('Moderate', 'Mod.')
                .replace('Slight', 'Slt.')
                .replace('Heavy', 'Hvy.')
        )
    )
    const xTicks = dimension === 'hour' ? Array.from({ length: 24 }, (_, index) => index) : Array.from({ length: 7 }, (_, index) => index)
    const hasData = ridges.length > 0

    const noteText =
        WEATHER_TEXT.ridgeline.noteLead +
        (dimension === 'hour' ? WEATHER_TEXT.ridgeline.notePerHour : WEATHER_TEXT.ridgeline.notePerDay) +
        WEATHER_TEXT.ridgeline.noteTail

    const plotLayout = {
        paper_bgcolor: PAPER_RAISED,
        plot_bgcolor: PAPER_RAISED,
        separators: ".'",
        margin: { l: 94, r: 24, t: 18, b: 52, pad: 10 },
        hovermode: 'closest',
        dragmode: false,
        autosize: true,
        xaxis: {
            title: {
                text: dimension === 'hour' ? 'Hour of Day' : 'Day of Week',
                font: { family: FONT_SANS, size: 13, weight: '500' },
                standoff: 50,
            },
            tickmode: 'array',
            tickvals: xTicks,
            ticktext: buildTickText(dimension),
            tickfont: { family: FONT_MONO, size: 10, color: INK_MUTED },
            gridcolor: RULE,
            zerolinecolor: RULE_STRONG,
        },
        yaxis: {
            title: {
                text: 'Weather',
                font: { family: FONT_SANS, size: 13, weight: '500' },
                standoff: 30,
            },
            tickmode: 'array',
            tickvals: yTickValues,
            ticktext: yTickText,
            tickfont: { family: FONT_MONO, size: 10, color: INK_MUTED },
            showgrid: false,
            zeroline: false,
            fixedrange: true,
            automargin: true,
        },
        hoverlabel: PLOTLY_HOVERLABEL,
        font: { family: FONT_MONO, size: 11, color: INK },
    }

    return { dimension, setDimension, traces, plotLayout, hasData, noteText }
}
