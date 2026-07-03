import { useEffect, useMemo, useRef } from 'react'
import { Chart } from 'chart.js/auto'
import {
    INK,
    INK_MUTED,
    RULE,
    FONT_DISPLAY,
    FONT_MONO,
} from '../../../utils/editorialTokens.js'
import { BAR_SOLID, BAR_NEUTRAL } from '../../../utils/styling'
import StatusMessage from '../../../components/StatusMessage.jsx'
import { COMPARISON_MODES } from '../utils/emission_factors.js'
import { kmToCo2Tonnes, formatTonnes } from '../utils/footprint_math.js'

/**
 * Horizontal bars re-expressing the period's total ridden distance as the CO2
 * the same travel would emit per mode. This is deliberately NOT an "avoided"
 * claim: it answers "what would the same kilometres emit by other modes".
 * @param {Object|null} totals - Ungrouped stats from /stats/ (total_distance_km)
 * @param {boolean} loading - Whether data is loading
 * @param {Error|null} error - Fetch error
 * @param {Function} onRefetch - Callback to trigger a retry after error
 */
export default function ModeComparisonBar({ totals, loading, error, onRefetch }) {
    const canvasRef = useRef(null)
    const chartRef = useRef(null)

    const bars = useMemo(() => {
        const distanceKm = Number(totals?.total_distance_km) || 0
        if (!distanceKm) return []
        return COMPARISON_MODES.map((mode) => ({
            label: mode.label,
            tonnes: kmToCo2Tonnes(distanceKm, mode.gPerKm),
            gPerKm: mode.gPerKm,
            isBike: mode.isBike,
        }))
    }, [totals])

    useEffect(() => {
        if (!canvasRef.current) return
        chartRef.current?.destroy()

        const ctx = canvasRef.current.getContext('2d')
        if (!ctx) return

        chartRef.current = new Chart(ctx, {
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
                                const amount = bar.tonnes < 0.5 ? '≈ 0 t CO2e' : `${formatTonnes(bar.tonnes)} t CO2e`
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
                            font: { family: FONT_DISPLAY, size: 13, weight: '500' },
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
        })

        return () => chartRef.current?.destroy()
    }, [bars])

    return (
        <div className="footprint-frame">
            <p className="footprint-frame__title">Same kilometres, different footprint</p>
            <div className="footprint-plot">
                {bars.length > 0 || loading || error
                    ? <canvas ref={canvasRef} />
                    : <div className="footprint-empty">No ride data available for this filter range.</div>}
                {(loading || error) && (
                    <StatusMessage loading={loading} error={error} onRefetch={onRefetch} />
                )}
            </div>
        </div>
    )
}
