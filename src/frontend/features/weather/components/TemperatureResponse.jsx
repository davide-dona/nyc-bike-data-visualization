import { useEffect, useMemo, useRef } from "react"
import { Chart } from "chart.js/auto"
import {
    ACCENT,
    INK,
    INK_MUTED,
    RULE,
    FONT_DISPLAY,
    FONT_MONO,
} from "../../../utils/editorialTokens.js"
import StatusMessage from "../../../components/StatusMessage"

// Bins observed for fewer hours than this are dropped: a 1-hour extreme
// temperature bin would otherwise produce a wild point at the curve's edge.
const MIN_HOURS = 5
const BIN_WIDTH = 2 // °C, must match _WEATHER_EXPRS in src/backend/services/ride_stats.py

const USER_TYPE_LABELS = { member: "Member", casual: "Casual" }
const USER_TYPE_COLORS = { member: ACCENT, casual: "#c24747" }

function formatSeries(series) {
    return series.map(({ userType, bins }) => ({
        userType,
        points: bins
            .filter((bin) => bin.weather_bin !== null && bin.hours_count >= MIN_HOURS)
            .map((bin) => ({ x: Number(bin.weather_bin), y: bin.total_rides / bin.hours_count }))
            .sort((a, b) => a.x - b.x),
    }))
}

/**
 * Line chart of average rides per hour across temperature bins, one curve per
 * user type to contrast member and casual weather sensitivity.
 * @param {Array} series - One entry per user type: { userType, bins }
 * @param {boolean} loading - Whether data is loading
 * @param {Error|null} error - Fetch error
 * @param {Function} onRefetch - Callback to trigger a retry after error
 */
export default function TemperatureResponse({ series, loading, error, onRefetch }) {
    const canvasRef = useRef(null)
    const chartRef = useRef(null)
    const formattedSeries = useMemo(() => formatSeries(series), [series])

    useEffect(() => {
        if (!canvasRef.current) return
        chartRef.current?.destroy()

        const ctx = canvasRef.current.getContext("2d")
        if (!ctx) return

        chartRef.current = new Chart(ctx, {
            type: "line",
            data: {
                datasets: formattedSeries.map(({ userType, points }) => ({
                    label: USER_TYPE_LABELS[userType] ?? userType,
                    data: points,
                    borderColor: USER_TYPE_COLORS[userType] ?? ACCENT,
                    backgroundColor: USER_TYPE_COLORS[userType] ?? ACCENT,
                    borderWidth: 2,
                    pointRadius: 2.5,
                    tension: 0.25,
                })),
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            font: { family: FONT_MONO, size: 10 },
                            color: INK_MUTED,
                            boxWidth: 12,
                            boxHeight: 12,
                            padding: 16,
                        },
                    },
                    tooltip: {
                        callbacks: {
                            title: (items) => `${items[0].parsed.x} to ${items[0].parsed.x + BIN_WIDTH}°C`,
                            label: (item) => `${item.dataset.label}: ${item.parsed.y.toFixed(0)} rides/h`,
                        },
                    },
                },
                scales: {
                    x: {
                        type: "linear",
                        title: {
                            display: true,
                            text: "Temperature (°C)",
                            font: { family: FONT_DISPLAY, size: 13, weight: "500" },
                            color: INK,
                        },
                        ticks: {
                            font: { family: FONT_MONO, size: 10 },
                            color: INK_MUTED,
                            callback: (value) => `${value}°`,
                        },
                        grid: { color: RULE },
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Rides Per Hour",
                            font: { family: FONT_DISPLAY, size: 13, weight: "500" },
                            color: INK,
                        },
                        ticks: {
                            font: { family: FONT_MONO, size: 10 },
                            color: INK_MUTED,
                            callback: (value) => Number(value).toFixed(0),
                        },
                        grid: { color: RULE },
                    },
                },
            },
        })

        return () => chartRef.current?.destroy()
    }, [formattedSeries])

    const hasData = formattedSeries.some((entry) => entry.points.length > 0)

    return (
        <div className="weather-deepdive-frame">
            <p className="weather-deepdive-frame__title">Temperature response — avg rides per hour</p>
            <div className="weather-deepdive-plot">
                {hasData || loading || error
                    ? <canvas ref={canvasRef} />
                    : <div className="weather-ridgeline-empty">No temperature data available for this filter range.</div>}
                {(loading || error) && (
                    <StatusMessage loading={loading} error={error} onRefetch={onRefetch} />
                )}
            </div>
        </div>
    )
}
