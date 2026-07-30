import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js/auto'

/** Shared Chart.js lifecycle hook: (re)creates the chart when structuralKey changes, destroys it on unmount, and applies cheap paint updates via chart.update('none') so scrubbing controls never stutter. */
export default function useChartJs({ buildConfig, structuralKey, paintKey = null, applyPaint = null }) {
    const canvasRef = useRef(null)
    const chartRef = useRef(null)
    const buildConfigRef = useRef(buildConfig)
    buildConfigRef.current = buildConfig
    const applyPaintRef = useRef(applyPaint)
    applyPaintRef.current = applyPaint
    const paintKeyRef = useRef(paintKey)
    paintKeyRef.current = paintKey
    // Skips the paint pass right after (re)creation so the creation animation isn't immediately overwritten.
    const paintedKeyRef = useRef(null)

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx) return undefined

        paintedKeyRef.current = paintKeyRef.current
        chartRef.current = new Chart(ctx, buildConfigRef.current())

        return () => {
            chartRef.current?.destroy()
            chartRef.current = null
        }
    }, [structuralKey])

    useEffect(() => {
        const chart = chartRef.current
        if (!chart || paintKey == null || paintedKeyRef.current === paintKey) return

        applyPaintRef.current?.(chart)
        paintedKeyRef.current = paintKey
        chart.update('none')
    }, [paintKey])

    return { canvasRef, chartRef }
}
