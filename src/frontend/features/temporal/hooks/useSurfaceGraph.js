import { useCallback, useMemo, useRef, useState } from 'react'
import { HOUR_LABELS, DAY_LABELS } from '@/utils/config.js'
import { PAPER_RAISED, FONT_MONO, INK, WARM_HIGHLIGHT } from '@/utils/editorialTokens.js'
import { EDITORIAL_COLORSCALE, editorialAxis, PLOTLY_HOVERLABEL } from '@/utils/styling'
import { getMetricConfig } from '../utils/metricFormatter.js'
import { buildSurfaceMatrix } from '../utils/surfaceMatrix.js'
import {
    AZIMUTH_PER_PIXEL,
    DISPLAY_MAX_DEG,
    DISPLAY_MIN_DEG,
    INITIAL_AZIMUTH,
    azimuthToDisplayAngle,
    buildCameraFromAzimuth,
    clampAzimuth,
    clampDisplayAngle,
    displayAngleToAzimuth,
} from '../utils/surfaceCamera.js'

/**
 * Handler hook owning the entire surface-graph state machine: the azimuth
 * camera with its drag scrubbing, the angle slider (pointer + keyboard), the
 * hover/click coordinate reporting, and the Plotly trace and layout building
 * for both the single-surface and compare modes.
 * @param {Array} data - Day-hour stats rows of the base layer.
 * @param {string} activeMetric - The selected metric key.
 * @param {Function} setCoordinates - Reports the hovered/clicked day-hour cell to the parent.
 * @param {boolean} loading - Whether the temporal data is loading (disables interaction).
 * @param {boolean} compareMode - Whether comparison surfaces are pinned.
 * @param {Array} layers - Active compare layers ({ label, dayHourStats, colorscale }).
 * @param {Object|null} pinnedSlice - The pinned bar ({ type: 'day'|'hour', index, label }) or null.
 * @param {Array|null} sliceValues - The pinned slice's metric values (24 for a day pin, 7 for an hour pin).
 * @returns {Object} Everything the SurfaceGraph render needs: refs, traces, layout, flags, and event handlers.
 */
export default function useSurfaceGraph({
    data,
    activeMetric,
    setCoordinates,
    loading,
    compareMode,
    layers,
    pinnedSlice,
    sliceValues,
}) {
    const safeData = Array.isArray(data) ? data : []
    const isInteractionDisabled = Boolean(loading)
    const hasSurfaceData = compareMode
        ? layers.some((layer) => Array.isArray(layer.dayHourStats) && layer.dayHourStats.length > 0)
        : safeData.length > 0
    const containerRef = useRef(null)
    const angleTrackRef = useRef(null)
    const dragPointerIdRef = useRef(null)
    const anglePointerIdRef = useRef(null)
    const dragStartXRef = useRef(0)
    const dragStartAzimuthRef = useRef(0)
    const [azimuth, setAzimuth] = useState(INITIAL_AZIMUTH)
    const [isDragging, setIsDragging] = useState(false)
    const isAngleSliderDisabled = Boolean(loading)
    const camera = useMemo(() => buildCameraFromAzimuth(azimuth), [azimuth])
    const rawDisplayAngle = useMemo(() => azimuthToDisplayAngle(azimuth), [azimuth])
    const roundedDisplayAngle = Math.round(rawDisplayAngle)
    const anglePercent = ((rawDisplayAngle - DISPLAY_MIN_DEG) / (DISPLAY_MAX_DEG - DISPLAY_MIN_DEG)) * 100
    const metric = useMemo(() => getMetricConfig(activeMetric), [activeMetric])

    const hoverTemplate = useMemo(
        () =>
            '<b>Weekly Pulse</b><br>' +
            'Day: <b>%{y}</b><br>' +
            'Hour: <b>%{x}</b><br>' +
            `${metric.noun}: <b>%{z:,.2f}</b> ${metric.unit}<extra></extra>`,
        [metric.noun, metric.unit]
    )

    const updateCoordinatesFromEvent = useCallback((eventData) => {
        const point = eventData?.points?.[0]
        if (!point) return

        setCoordinates({
            day: point.y,
            hour: point.x,
            value: point.z,
            layer: point?.data?.name ?? null,
        })
    }, [setCoordinates])

    const handleSurfaceClick = useCallback((eventData) => {
        updateCoordinatesFromEvent(eventData)
    }, [updateCoordinatesFromEvent])

    const handleSurfaceHover = useCallback((eventData) => {
        updateCoordinatesFromEvent(eventData)
    }, [updateCoordinatesFromEvent])

    const handleSurfaceUnhover = useCallback(() => {
        setCoordinates(null)
    }, [setCoordinates])

    const compareTraces = useMemo(() => {
        if (!compareMode || layers.length <= 1) return []

        return layers.map((layer, index) => {
            const matrix = buildSurfaceMatrix(layer.dayHourStats ?? [], metric.get)
            const isBase = index === 0
            const layerHoverTemplate =
                `<b>${layer.label}</b><br>` +
                'Day: <b>%{y}</b><br>' +
                'Hour: <b>%{x}</b><br>' +
                `${metric.noun}: <b>%{z:,.2f}</b> ${metric.unit}<extra></extra>`

            return {
                type: 'surface',
                name: layer.label,
                z: matrix,
                x: HOUR_LABELS,
                y: DAY_LABELS,
                colorscale: layer.colorscale ?? EDITORIAL_COLORSCALE,
                opacity: isBase ? 0.92 : 0.55,
                showscale: false,
                hovertemplate: layerHoverTemplate,
            }
        })
    }, [compareMode, layers, metric])

    const singleTrace = useMemo(() => ({
        type: 'surface',
        z: buildSurfaceMatrix(safeData, metric.get),
        x: HOUR_LABELS,
        y: DAY_LABELS,
        colorscale: EDITORIAL_COLORSCALE,
        showscale: false,
        hovertemplate: hoverTemplate,
    }), [safeData, metric, hoverTemplate])

    const traces = compareTraces.length > 0 ? compareTraces : [singleTrace]
    const hasTraces = traces.length > 0 && traces.some((trace) => Array.isArray(trace.z) && trace.z.length > 0)
    const canSelectPoints = hasTraces && hasSurfaceData

    const maxZ = useMemo(() => {
        let zMax = 0

        for (let i = 0; i < traces.length; i++) {
            const matrix = traces[i].z
            for (let row = 0; row < matrix.length; row++) {
                for (let col = 0; col < matrix[row].length; col++) {
                    zMax = Math.max(zMax, Number(matrix[row][col]) || 0)
                }
            }
        }

        return zMax
    }, [traces])

    // Amber slice line for the pinned day/hour, lifted slightly above the
    // surface to avoid z-fighting. Never shown while comparing surfaces.
    const sliceTrace = useMemo(() => {
        if (compareMode || !pinnedSlice || !Array.isArray(sliceValues)) return null

        const lift = maxZ * 0.01
        const isDayPin = pinnedSlice.type === 'day'
        return {
            type: 'scatter3d',
            mode: 'lines',
            x: isDayPin ? HOUR_LABELS : Array(7).fill(HOUR_LABELS[pinnedSlice.index]),
            y: isDayPin ? Array(24).fill(DAY_LABELS[pinnedSlice.index]) : DAY_LABELS,
            z: sliceValues.map((value) => (Number(value) || 0) + lift),
            line: { color: WARM_HIGHLIGHT, width: 6 },
            showlegend: false,
            hovertemplate: hoverTemplate,
        }
    }, [compareMode, pinnedSlice, sliceValues, maxZ, hoverTemplate])

    const plotTraces = sliceTrace ? [...traces, sliceTrace] : traces

    const plotLayout = {
        paper_bgcolor: PAPER_RAISED,
        plot_bgcolor: PAPER_RAISED,
        separators: ".'",
        transition: {
            duration: 420,
            easing: 'cubic-in-out',
        },
        scene: {
            dragmode: false,
            camera,
            xaxis: editorialAxis('Hour of Day'),
            yaxis: editorialAxis('Day of Week'),
            zaxis: {
                ...editorialAxis(metric.label),
                range: [0, maxZ === 0 ? 1 : maxZ],
            },
            bgcolor: PAPER_RAISED,
            aspectmode: 'manual',
            aspectratio: { x: 1.8, y: 1, z: 0.7 },
        },
        margin: { l: 0, r: 0, b: 0, t: 24 },
        font: { family: FONT_MONO, color: INK, size: 12 },
        hoverlabel: PLOTLY_HOVERLABEL,
    }

    const handlePointerDown = useCallback((event) => {
        if (isInteractionDisabled) return
        if (event.button !== 0) return

        const container = containerRef.current
        if (!container) return

        dragPointerIdRef.current = event.pointerId
        dragStartXRef.current = event.clientX
        dragStartAzimuthRef.current = azimuth
        setIsDragging(true)
        container.setPointerCapture(event.pointerId)
    }, [azimuth, isInteractionDisabled])

    const handlePointerMove = useCallback((event) => {
        if (dragPointerIdRef.current !== event.pointerId) return

        const deltaX = event.clientX - dragStartXRef.current
        const nextAzimuth = dragStartAzimuthRef.current - deltaX * AZIMUTH_PER_PIXEL
        setAzimuth(clampAzimuth(nextAzimuth))
    }, [])

    const stopDragging = useCallback((event) => {
        if (dragPointerIdRef.current !== event.pointerId) return

        const container = containerRef.current
        if (container && container.hasPointerCapture(event.pointerId)) {
            container.releasePointerCapture(event.pointerId)
        }

        dragPointerIdRef.current = null
        setIsDragging(false)
    }, [])

    const updateAngleFromClientX = useCallback((clientX) => {
        const trackNode = angleTrackRef.current
        if (!trackNode) return

        const rect = trackNode.getBoundingClientRect()
        if (rect.width <= 0) return

        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
        const nextDisplayAngle = DISPLAY_MIN_DEG + ratio * (DISPLAY_MAX_DEG - DISPLAY_MIN_DEG)
        setAzimuth(displayAngleToAzimuth(nextDisplayAngle))
    }, [])

    const handleAnglePointerDown = useCallback((event) => {
        if (isAngleSliderDisabled) return
        if (event.button !== 0) return

        event.preventDefault()
        event.stopPropagation()

        anglePointerIdRef.current = event.pointerId
        event.currentTarget.setPointerCapture(event.pointerId)
        updateAngleFromClientX(event.clientX)
    }, [isAngleSliderDisabled, updateAngleFromClientX])

    const handleAnglePointerMove = useCallback((event) => {
        if (isAngleSliderDisabled) return
        if (anglePointerIdRef.current !== event.pointerId) return

        event.preventDefault()
        event.stopPropagation()
        updateAngleFromClientX(event.clientX)
    }, [isAngleSliderDisabled, updateAngleFromClientX])

    const stopAngleDragging = useCallback((event) => {
        if (isAngleSliderDisabled) return
        if (anglePointerIdRef.current !== event.pointerId) return

        event.preventDefault()
        event.stopPropagation()

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
        }

        anglePointerIdRef.current = null
    }, [isAngleSliderDisabled])

    const handleAngleKeyDown = useCallback((event) => {
        if (isAngleSliderDisabled) return
        const step = event.shiftKey ? 6 : 2
        let nextDisplayAngle = null

        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            nextDisplayAngle = clampDisplayAngle(rawDisplayAngle - step)
        }

        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            nextDisplayAngle = clampDisplayAngle(rawDisplayAngle + step)
        }

        if (nextDisplayAngle === null) return

        event.preventDefault()
        event.stopPropagation()
        setAzimuth(displayAngleToAzimuth(nextDisplayAngle))
    }, [isAngleSliderDisabled, rawDisplayAngle])

    return {
        containerRef,
        angleTrackRef,
        isInteractionDisabled,
        isAngleSliderDisabled,
        isDragging,
        hasTraces,
        canSelectPoints,
        plotTraces,
        plotLayout,
        roundedDisplayAngle,
        anglePercent,
        handleSurfaceClick,
        handleSurfaceHover,
        handleSurfaceUnhover,
        handlePointerDown,
        handlePointerMove,
        stopDragging,
        handleAnglePointerDown,
        handleAnglePointerMove,
        stopAngleDragging,
        handleAngleKeyDown,
    }
}
