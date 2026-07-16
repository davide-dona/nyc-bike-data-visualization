import {
    INK,
    INK_MUTED,
    RULE,
    FONT_SANS,
    FONT_MONO,
} from '@/utils/editorialTokens.js'
import { BAR_SOLID, BAR_NEUTRAL } from '@/utils/styling'
import { COMPARISON_MODES } from './emissionFactors.js'
import { kmToCo2Tonnes } from './footprintMath.js'
import { formatNumber } from '@/utils/numberFormat.js'

/**
 * Re-expresses the period's total ridden distance as the CO2 the same travel
 * would emit per mode.
 * @param {Object} totals - Summed daily stats (total_distance_km).
 * @returns {Array} One bar per mode with label, tonnes, and emission factor.
 */
export function buildModeComparisonBars(totals) {
    const distanceKm = Number(totals?.total_distance_km) || 0
    if (!distanceKm) return []
    return COMPARISON_MODES.map((mode) => ({
        label: mode.label,
        tonnes: kmToCo2Tonnes(distanceKm, mode.gPerKm),
        gPerKm: mode.gPerKm,
        isBike: mode.isBike,
    }))
}

/**
 * Builds the Chart.js config for the mode-comparison horizontal bars.
 * @param {Array} bars - Bars shaped by buildModeComparisonBars.
 * @returns {Object} The Chart.js config.
 */
export function buildModeComparisonConfig(bars) {
    return {
        type: 'bar',
        data: {
            labels: bars.map((bar) => bar.label),
            datasets: [{
                data: bars.map((bar) => bar.tonnes),
                backgroundColor: bars.map((bar) => (bar.isBike ? BAR_SOLID : BAR_NEUTRAL)),
            }],
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (item) => {
                            const bar = bars[item.dataIndex]
                            const amount = bar.tonnes < 0.5 ? '≈ 0 t CO2e' : `${formatNumber(bar.tonnes, 2)} t CO2e`
                            return `${amount} if the same km were by ${bar.label.toLowerCase()} (${bar.gPerKm} g/km)`
                        },
                    },
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 't CO2e for the selected period',
                        font: { family: FONT_SANS, size: 13, weight: '500' },
                        color: INK,
                    },
                    ticks: { font: { family: FONT_MONO, size: 10 }, color: INK_MUTED },
                    grid: { color: RULE },
                },
                y: {
                    ticks: { font: { family: FONT_MONO, size: 10 }, color: INK_MUTED },
                    grid: { display: false },
                },
            },
        },
    }
}
