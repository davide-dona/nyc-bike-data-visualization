import { useEffect, useMemo, useRef } from "react"
import { Chart } from "chart.js/auto"
import {
    INK,
    INK_MUTED,
    RULE,
    FONT_DISPLAY,
    FONT_MONO,
} from "../../../utils/editorialTokens.js"
import { BAR_SOLID, BAR_MUTED } from "../../../utils/styling"
import StatusMessage from "../../../components/StatusMessage"

// Labels keyed on the backend bucket lower edges (mm/h),
// must match _WEATHER_EXPRS in src/backend/services/ride_stats.py.
const RAIN_BUCKETS = [
    { bin: 0, label: "Dry" },
    { bin: 0.1, label: "Trace (<0.5)" },
    { bin: 0.5, label: "Light (0.5–2.5)" },
    { bin: 2.5, label: "Moderate (2.5–7.6)" },
    { bin: 7.6, label: "Heavy (>7.6)" },
]

function formatBuckets(data) {
    const byBin = new Map(
        data.filter((row) => row.weather_bin !== null).map((row) => [Number(row.weather_bin), row])
    )
    const dry = byBin.get(0)
    const dryRate = dry?.hours_count ? dry.total_rides / dry.hours_count : 0
    if (!dryRate) return []

    return RAIN_BUCKETS.flatMap(({ bin, label }) => {
        const row = byBin.get(bin)
        if (!row?.hours_count) return []
        return [{
            label,
            pct: (100 * row.total_rides) / row.hours_count / dryRate,
            hoursCount: row.hours_count,
        }]
    })
}

/**
 * Bar chart of ridership per precipitation bucket, relative to the dry-weather
 * baseline (dry = 100%).
 * @param {Array} data - Grouped stats bucketed by precipitation
 * @param {boolean} loading - Whether data is loading
 * @param {Error|null} error - Fetch error
 * @param {Function} onRefetch - Callback to trigger a retry after error
 */
export default function RainImpact({ data, loading, error, onRefetch }) {
    const canvasRef = useRef(null)
    const chartRef = useRef(null)
    const buckets = useMemo(() => formatBuckets(data), [data])

    useEffect(() => {
        if (!canvasRef.current) return
        chartRef.current?.destroy()

        const ctx = canvasRef.current.getContext("2d")
        if (!ctx) return

        chartRef.current = new Chart(ctx, {
            type: "bar",
            data: {
                labels: buckets.map((bucket) => bucket.label),
                datasets: [{
                    data: buckets.map((bucket) => bucket.pct),
                    backgroundColor: buckets.map((bucket) => (bucket.label === "Dry" ? BAR_MUTED : BAR_SOLID)),
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (item) => {
                                const bucket = buckets[item.dataIndex]
                                return `${item.parsed.y.toFixed(0)}% of dry-weather pace (${bucket.hoursCount.toLocaleString()} observed hours)`
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Precipitation (mm/h)",
                            font: { family: FONT_DISPLAY, size: 13, weight: "500" },
                            color: INK,
                        },
                        ticks: { font: { family: FONT_MONO, size: 10 }, color: INK_MUTED },
                        grid: { display: false },
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "% of Dry-Weather Ridership",
                            font: { family: FONT_DISPLAY, size: 13, weight: "500" },
                            color: INK,
                        },
                        ticks: {
                            font: { family: FONT_MONO, size: 10 },
                            color: INK_MUTED,
                            callback: (value) => `${Number(value).toFixed(0)}%`,
                        },
                        grid: { color: RULE },
                    },
                },
            },
        })

        return () => chartRef.current?.destroy()
    }, [buckets])

    return (
        <div className="weather-deepdive-frame">
            <p className="weather-deepdive-frame__title">Rain impact — ridership vs dry baseline</p>
            <div className="weather-deepdive-plot">
                {buckets.length > 0 || loading || error
                    ? <canvas ref={canvasRef} />
                    : <div className="weather-ridgeline-empty">No precipitation data available for this filter range.</div>}
                {(loading || error) && (
                    <StatusMessage loading={loading} error={error} onRefetch={onRefetch} />
                )}
            </div>
        </div>
    )
}
