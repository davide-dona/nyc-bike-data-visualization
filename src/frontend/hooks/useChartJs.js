import { useEffect, useRef } from 'react'
import { Chart } from 'chart.js/auto'

/**
 * Shared Chart.js lifecycle hook: creates the chart when its structure
 * changes, destroys it on unmount, and applies cheap value/color changes in
 * place with chart.update('none') so scrubbing controls never stutter.
 * @param {Function} buildConfig - Returns the Chart.js config; read through a ref so it may close over current props.
 * @param {string} structuralKey - Recreates the chart whenever this key changes.
 * @param {string|null} [paintKey=null] - In-place update trigger; pass null for charts without in-place updates.
 * @param {Function|null} [applyPaint=null] - Mutates chart.data for an in-place update; called before chart.update('none').
 * @returns {Object} canvasRef to attach to the canvas element, and chartRef holding the live Chart instance.
 */
export default function useChartJs({ buildConfig, structuralKey, paintKey = null, applyPaint = null }) {
    const canvasRef = useRef(null)
    const chartRef = useRef(null)
    const buildConfigRef = useRef(buildConfig)
    buildConfigRef.current = buildConfig
    const applyPaintRef = useRef(applyPaint)
    applyPaintRef.current = applyPaint
    const paintKeyRef = useRef(paintKey)
    paintKeyRef.current = paintKey
    // Tracks what the chart currently displays so the paint effect can skip
    // the redundant pass right after (re)creation, preserving the creation
    // animation.
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
