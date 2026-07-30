import { useMemo } from 'react'
import useChartJs from '@/hooks/useChartJs.js'
import {
    formatTemperatureSeries,
    buildTemperatureResponseConfig,
} from '../utils/temperatureResponseConfig.js'

/**
 * Handler hook for the temperature-response line chart: shapes the per-user-type series and wires the Chart.js canvas.
 * @param {Object} params
 * @param {Array} params.series - One entry per user type: { userType, bins }.
 * @returns {{canvasRef: Object, hasData: boolean}} Canvas ref and whether any series has points.
 */
export default function useTemperatureResponseChart({ series }) {
    const formattedSeries = useMemo(() => formatTemperatureSeries(series), [series])
    const hasData = formattedSeries.some((entry) => entry.points.length > 0)

    const { canvasRef } = useChartJs({
        buildConfig: () => buildTemperatureResponseConfig(formattedSeries),
        structuralKey: useMemo(() => JSON.stringify(formattedSeries), [formattedSeries]),
    })

    return { canvasRef, hasData }
}
