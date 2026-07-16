import { Chart } from 'chart.js/auto'
import {
    INK,
    PAPER_RAISED,
    ACCENT,
    FONT_SANS,
    FONT_MONO,
} from '../editorialTokens.js'
import { toRgba } from '../color.js'

// Single source for the near-black tooltip surface and accent border shared
// by every Chart.js and Plotly tooltip.
export const CHART_TOOLTIP_BG = toRgba(INK, 0.94)
export const CHART_TOOLTIP_BORDER = toRgba(ACCENT, 0.72)

/** Plotly hoverlabel config matching the Chart.js tooltip theme. */
export const PLOTLY_HOVERLABEL = {
    bgcolor: CHART_TOOLTIP_BG,
    bordercolor: CHART_TOOLTIP_BORDER,
    align: 'left',
    namelength: -1,
    font: { family: FONT_MONO, size: 11, color: PAPER_RAISED },
}

let applied = false

/**
 * Apply editorial defaults to Chart.js once at app startup, and publish the
 * shared tooltip surface as CSS custom properties so stylesheets (floating
 * tooltip, deck.gl tooltip) use the exact same tokens. Every subsequent
 * `new Chart(...)` picks these defaults up automatically, so per-chart config
 * only needs to override what is truly chart-specific.
 */
export function applyEditorialChartDefaults() {
    if (applied) return
    applied = true

    const rootStyle = document.documentElement.style
    rootStyle.setProperty('--tooltip-bg', CHART_TOOLTIP_BG)
    rootStyle.setProperty('--tooltip-border', CHART_TOOLTIP_BORDER)
    rootStyle.setProperty('--tooltip-text', PAPER_RAISED)
    rootStyle.setProperty('--tooltip-font', FONT_MONO)

    Chart.defaults.font.family = FONT_SANS
    Chart.defaults.font.size = 12
    Chart.defaults.color = INK

    const tooltip = Chart.defaults.plugins.tooltip
    tooltip.backgroundColor = CHART_TOOLTIP_BG
    tooltip.titleColor = PAPER_RAISED
    tooltip.bodyColor = PAPER_RAISED
    tooltip.borderColor = CHART_TOOLTIP_BORDER
    tooltip.borderWidth = 1
    tooltip.cornerRadius = 2
    tooltip.padding = { top: 12, right: 14, bottom: 12, left: 14 }
    tooltip.displayColors = true
    tooltip.boxPadding = 5
    tooltip.bodySpacing = 4
    tooltip.titleMarginBottom = 7
    tooltip.caretPadding = 10
    tooltip.caretSize = 6
    tooltip.usePointStyle = true
    tooltip.titleFont = { family: FONT_MONO, size: 10 }
    tooltip.bodyFont = { family: FONT_MONO, size: 11 }
}
