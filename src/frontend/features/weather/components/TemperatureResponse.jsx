import { useMemo } from "react"
import useChartJs from "@/hooks/useChartJs.js"
import ChartFrame from "@/components/ChartFrame.jsx"
import {
    formatTemperatureSeries,
    buildTemperatureResponseConfig,
} from "../utils/temperatureResponseConfig.js"

/**
 * Line chart of average rides per hour across temperature bins, one curve per
 * user type to contrast member and casual weather sensitivity.
 * @param {Array} series - One entry per user type: { userType, bins }
 * @param {boolean} loading - Whether data is loading
 * @param {Error|null} error - Fetch error
 * @param {Function} onRefetch - Callback to trigger a retry after error
 */
export default function TemperatureResponse({ series, loading, error, onRefetch }) {
    const formattedSeries = useMemo(() => formatTemperatureSeries(series), [series])
    const hasData = formattedSeries.some((entry) => entry.points.length > 0)

    const { canvasRef } = useChartJs({
        buildConfig: () => buildTemperatureResponseConfig(formattedSeries),
        structuralKey: useMemo(() => JSON.stringify(formattedSeries), [formattedSeries]),
    })

    return (
        <ChartFrame
            title="Temperature response - avg rides per hour"
            note="Lines track how hourly demand climbs with temperature for each rider group. Where the curves separate, casual riders react to weather more strongly than members."
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={!hasData ? 'No temperature data available for this filter range.' : null}
            frameClassName="weather-deepdive-frame"
            titleClassName="weather-deepdive-frame__title"
            plotClassName="weather-deepdive-plot"
        >
            <canvas ref={canvasRef} />
        </ChartFrame>
    )
}
