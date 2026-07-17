import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSpeedHandler } from './useSpeedHandler.js'
import {
    HOURS_IN_DAY,
    BASE_FRAME_MS,
    MINUTES_IN_HOUR,
    MINUTES_IN_DAY,
    MAX_MINUTE_INDEX,
    TIME_DRAG_THRESHOLD_PX,
    SPEED_OPTIONS,
    clamp,
    normalizeTime,
    formatTimeLabel,
    createHourMarks,
} from '../utils/speedController.js'

/**
 * Handler hook owning the entire time-wheel state machine: playback (via
 * useSpeedHandler), the pointer-capture drag scrubbing, keyboard scrubbing
 * and speed stepping, and the derived tick/label/transform values. The wheel
 * wraps seamlessly past midnight in both directions: the tick strip is
 * periodic, so 23:59 -> 00:00 is just another step.
 * @param {Function} setCurrentTime - Updates the current time in the parent component.
 * @param {number} currentTime - The current time in hours (fractional values represent minutes).
 * @param {boolean} disabled - When true, all pointer/keyboard interaction is suppressed and playback pauses.
 * @returns {Object} Everything the SpeedController render needs: refs, state, derived values, and event handlers.
 */
export default function useTimeWheel({ setCurrentTime, currentTime, disabled }) {
    const trackRef = useRef(null)
    const activePointerIdRef = useRef(null)
    const dragStartXRef = useRef(0)
    const dragStartMinuteIndexRef = useRef(0)
    const dragTrackWidthRef = useRef(0)
    const hasDraggedRef = useRef(false)
    const [isDragging, setIsDragging] = useState(false)
    const { isPlaying, setIsPlaying, setSpeed, speed } = useSpeedHandler({
        setCurrentTime,
        currentTime,
        hoursInDay: HOURS_IN_DAY,
        baseFrameMs: BASE_FRAME_MS,
    })

    // Pause playback whenever the surrounding controls disable.
    useEffect(() => {
        if (disabled) {
            setIsPlaying(false)
        }
    }, [disabled, setIsPlaying])

    const hourMarks = useMemo(() => createHourMarks(), [])
    const currentTimeLabel = useMemo(() => formatTimeLabel(currentTime), [currentTime])
    const currentMinuteIndex = useMemo(() => {
        const normalizedTime = normalizeTime(currentTime)
        return clamp(Math.floor(normalizedTime * MINUTES_IN_HOUR), 0, MAX_MINUTE_INDEX)
    }, [currentTime])

    // One day of minutes spans one period (100%) of the periodic tick strip
    const currentPosition = (currentMinuteIndex / MINUTES_IN_DAY) * 100
    const stripTransform = `translateX(calc(50% - ${currentPosition}%))`

    const stopDragging = useCallback(() => {
        const track = trackRef.current
        if (track != null && activePointerIdRef.current != null && track.hasPointerCapture(activePointerIdRef.current)) {
            track.releasePointerCapture(activePointerIdRef.current)
        }
        activePointerIdRef.current = null
        dragStartXRef.current = 0
        dragStartMinuteIndexRef.current = 0
        dragTrackWidthRef.current = 0
        setIsDragging(false)
        hasDraggedRef.current = false
    }, [])

    const handlePointerDown = (event) => {
        if (disabled) {
            return
        }

        if (event.button !== 0) {
            return
        }

        event.preventDefault()

        const track = trackRef.current
        if (track == null) {
            return
        }

        activePointerIdRef.current = event.pointerId
        track.setPointerCapture(event.pointerId)
        setIsDragging(true)
        dragStartXRef.current = event.clientX
        dragStartMinuteIndexRef.current = currentMinuteIndex
        dragTrackWidthRef.current = track.getBoundingClientRect().width
        hasDraggedRef.current = false
    }

    const handlePointerMove = (event) => {
        if (disabled) {
            return
        }

        if (!isDragging || activePointerIdRef.current !== event.pointerId) {
            return
        }

        if (!hasDraggedRef.current) {
            const dragDelta = Math.abs(event.clientX - dragStartXRef.current)
            if (dragDelta < TIME_DRAG_THRESHOLD_PX) {
                return
            }
            hasDraggedRef.current = true
        }

        event.preventDefault()
        const trackWidth = dragTrackWidthRef.current
        if (trackWidth <= 0) {
            return
        }

        // The visible rail spans one full day (24h); no clamping since the wheel is circular and wraps.
        const deltaX = event.clientX - dragStartXRef.current
        const minuteDelta = (deltaX / trackWidth) * MINUTES_IN_DAY
        const nextMinuteIndex = dragStartMinuteIndexRef.current - minuteDelta
        setCurrentTime(normalizeTime(nextMinuteIndex / MINUTES_IN_HOUR))
    }

    const handlePointerUp = (event) => {
        if (disabled) {
            return
        }

        if (activePointerIdRef.current !== event.pointerId) {
            return
        }
        stopDragging()
    }

    const handlePointerCancel = (event) => {
        if (disabled) {
            return
        }

        if (activePointerIdRef.current !== event.pointerId) {
            return
        }
        stopDragging()
    }

    const stepSpeed = useCallback(
        (direction) => {
            const currentIndex = SPEED_OPTIONS.indexOf(speed)
            const safeIndex = currentIndex === -1 ? SPEED_OPTIONS.indexOf(1) : currentIndex
            const nextIndex = clamp(safeIndex + direction, 0, SPEED_OPTIONS.length - 1)
            setSpeed(SPEED_OPTIONS[nextIndex])
        },
        [speed, setSpeed],
    )

    const handleSpeedKeyDown = (event) => {
        if (disabled) {
            return
        }

        const stepMap = {
            ArrowLeft: -1,
            ArrowDown: -1,
            ArrowRight: 1,
            ArrowUp: 1,
        }

        if (event.key === 'Home') {
            event.preventDefault()
            setSpeed(SPEED_OPTIONS[0])
            return
        }

        if (event.key === 'End') {
            event.preventDefault()
            setSpeed(SPEED_OPTIONS[SPEED_OPTIONS.length - 1])
            return
        }

        if (!(event.key in stepMap)) {
            return
        }

        event.preventDefault()
        stepSpeed(stepMap[event.key])
    }

    const handleKeyDown = (event) => {
        if (disabled) {
            return
        }

        const stepMap = {
            ArrowLeft: 1,
            ArrowDown: 1,
            ArrowRight: -1,
            ArrowUp: -1,
            PageDown: 15,
            PageUp: -15,
        }

        if (event.key === 'Home') {
            event.preventDefault()
            setCurrentTime(0)
            return
        }

        if (event.key === 'End') {
            event.preventDefault()
            setCurrentTime(MAX_MINUTE_INDEX / MINUTES_IN_HOUR)
            return
        }

        if (!(event.key in stepMap)) {
            return
        }

        event.preventDefault()
        // Wraps around midnight instead of clamping: the wheel is circular
        const nextMinuteIndex = currentMinuteIndex + stepMap[event.key]
        setCurrentTime(normalizeTime(nextMinuteIndex / MINUTES_IN_HOUR))
    }

    return {
        trackRef,
        isDragging,
        isPlaying,
        setIsPlaying,
        speed,
        setSpeed,
        hourMarks,
        currentTimeLabel,
        currentMinuteIndex,
        stripTransform,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handlePointerCancel,
        handleKeyDown,
        handleSpeedKeyDown,
    }
}
