import { useMemo } from "react"
import useChartJs from "@/hooks/useChartJs.js"
import ChartFrame from "@/components/ChartFrame.jsx"
import { formatRainBuckets, buildRainImpactConfig } from "../utils/rainImpactConfig.js"

/**
 * Bar chart of ridership per precipitation bucket, relative to the dry-weather
 * baseline (dry = 100%).
 * @param {Array} data - Grouped stats bucketed by precipitation
 * @param {boolean} loading - Whether data is loading
 * @param {Error|null} error - Fetch error
 * @param {Function} onRefetch - Callback to trigger a retry after error
 */
export default function RainImpact({ data, loading, error, onRefetch }) {
    const buckets = useMemo(() => formatRainBuckets(data), [data])

    const { canvasRef } = useChartJs({
        buildConfig: () => buildRainImpactConfig(buckets),
        structuralKey: useMemo(() => JSON.stringify(buckets), [buckets]),
    })

    return (
        <ChartFrame
            title="Rain impact - ridership vs dry baseline"
            note="Bars compare hourly ridership under each rain intensity compared to the dry-weather baseline (100%), showing how rain reduces ridership."
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={buckets.length === 0 ? 'No precipitation data available for this filter range.' : null}
            frameClassName="weather-deepdive-frame"
            titleClassName="weather-deepdive-frame__title"
            plotClassName="weather-deepdive-plot"
        >
            <canvas ref={canvasRef} />
        </ChartFrame>
    )
}
