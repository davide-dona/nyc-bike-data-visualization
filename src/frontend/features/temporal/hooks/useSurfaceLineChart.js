import { useMemo } from 'react'
import { getMetricConfig } from '../utils/metricFormatter.js'
import { buildSeries } from '../utils/lineSeries.js'
import { PLOTLY_HOVERLABEL } from '@/utils/styling'
import {
    ACCENT,
    INK_MUTED,
    PAPER_RAISED,
    FONT_MONO,
    RULE_STRONG,
    FONT_SANS,
} from '@/utils/editorialTokens.js'

/**
 * Handler hook building the per-date line chart traces and layout for the
 * selected metric, drawing one line per layer in compare mode.
 * @param {Array} dateData - Per-date stats rows of the base layer.
 * @param {string} activeMetric - Selected metric key.
 * @param {boolean} compareMode - Whether compare layers are pinned.
 * @param {Array} layers - Visible layers (base plus compare layers).
 * @returns {Object} The metric config, Plotly traces and layout, and the hasData flag.
 */
export default function useSurfaceLineChart({ dateData, activeMetric, compareMode, layers }) {
    // Each point is a single calendar date, so total_rides here is that day's own total, not an average.
    const metric = useMemo(() => getMetricConfig(activeMetric, 'daily'), [activeMetric])

    const singleSeries = useMemo(
        () => buildSeries(dateData ?? [], metric.get),
        [dateData, metric],
    )

    const compareTraces = useMemo(() => {
        if (!compareMode || layers.length === 0) return []

        return layers
            .map((layer, index) => {
                const series = buildSeries(layer.dateStats ?? [], metric.get)
                if (series.length === 0) return null

                return {
                    type: 'scatter',
                    mode: 'lines+markers',
                    name: layer.label,
                    x: series.map((point) => point.date),
                    y: series.map((point) => point.value),
                    line: {
                        color: layer.color,
                        width: index === 0 ? 2.4 : 1.8,
                    },
                    marker: {
                        color: layer.color,
                        size: index === 0 ? 4.2 : 3.2,
                    },
                    hovertemplate:
                        `<b>${layer.label}</b><br>` +
                        'Moment: <b>%{x|%b %d, %Y}</b><br>' +
                        `${metric.label}: <b>%{y:,.2f}</b><extra></extra>`,
                }
            })
            .filter(Boolean)
    }, [compareMode, layers, metric])

    const singleTrace = useMemo(
        () => ({
            type: 'scatter',
            mode: 'lines+markers',
            name: metric.label,
            x: singleSeries.map((point) => point.date),
            y: singleSeries.map((point) => point.value),
            line: {
                color: ACCENT,
                width: 2.3,
            },
            marker: {
                color: ACCENT,
                size: 3.8,
            },
            hovertemplate:
                'Moment: <b>%{x|%b %d, %Y}</b><br>' +
                `${metric.label}: <b>%{y:,.2f}</b><extra></extra>`,
        }),
        [singleSeries, metric],
    )

    const traces = compareTraces.length > 0 ? compareTraces : [singleTrace]
    const hasData = traces.some((trace) => Array.isArray(trace.y) && trace.y.length > 0)

    const plotLayout = {
        paper_bgcolor: PAPER_RAISED,
        plot_bgcolor: PAPER_RAISED,
        separators: ".'",
        margin: { l: 56, r: 20, t: 10, b: 54 },
        showlegend: compareTraces.length > 0,
        legend: {
            orientation: 'h',
            yanchor: 'bottom',
            y: 1.02,
            xanchor: 'left',
            x: 0,
            font: { family: FONT_MONO, size: 10, color: INK_MUTED },
        },
        xaxis: {
            type: 'date',
            title: {
                text: 'Date',
                font: { family: FONT_SANS, size: 11, color: INK_MUTED },
            },
            tickfont: { family: FONT_MONO, size: 10, color: INK_MUTED },
            gridcolor: 'transparent',
            zerolinecolor: RULE_STRONG,
        },
        yaxis: {
            title: {
                text: metric.label,
                font: { family: FONT_SANS, size: 11, color: INK_MUTED },
            },
            tickfont: { family: FONT_MONO, size: 10, color: INK_MUTED },
            zerolinecolor: RULE_STRONG,
        },
        hoverlabel: PLOTLY_HOVERLABEL,
    }

    return { metric, traces, hasData, plotLayout }
}
