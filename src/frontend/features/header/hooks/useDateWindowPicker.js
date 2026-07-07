import { useEffect, useMemo, useRef, useState } from 'react'
import useDateRangeBounds from './useDateBounds.js'
import { formatIsoDate, lastDayOfMonth } from '@/utils/dateFormat.js'

/**
 * Handler hook owning the whole date window picker state machine: the
 * committed start/end months synced from the outside value, the open/close
 * lifecycle of the month modal (with animation flags and positioning), month
 * availability against the dataset bounds, click-to-select with automatic
 * bound swapping, range shading, and year navigation.
 * @param {Object|null} value - The committed {start_date, end_date} range.
 * @param {Function} onCommit - Commits a {start_date, end_date} range.
 * @param {boolean} disabled - Parent-level disable (global fetches in flight).
 * @returns {Object} Picker state, refs, and handlers for the render-only component.
 */
export default function useDateWindowPicker({ value, onCommit, disabled = false }) {
    const { bounds, loading } = useDateRangeBounds()
    const [openFor, setOpenFor] = useState(null) // 'start' | 'end' | null
    const [visibleYear, setVisibleYear] = useState(null)
    const [start, setStart] = useState(null)
    const [end, setEnd] = useState(null)

    const initialStartRef = useRef(null)
    const initialEndRef = useRef(null)
    const startAnchorRef = useRef(null)
    const endAnchorRef = useRef(null)
    const wrapperRef = useRef(null)
    const modalRef = useRef(null)
    const [modalStyle, setModalStyle] = useState({ top: null, left: null })
    const onCommitRef = useRef(onCommit)
    const [isClosing, setIsClosing] = useState(false)
    const [isOpenedVisible, setIsOpenedVisible] = useState(false)

    useEffect(() => { onCommitRef.current = onCommit }, [onCommit])

    useEffect(() => {
        if (value?.start_date && value?.end_date) {
            const s = new Date(value.start_date)
            const e = new Date(value.end_date)
            const newStart = { year: s.getFullYear(), month: s.getMonth() }
            const newEnd = { year: e.getFullYear(), month: e.getMonth() }

            // Update start/end only if changed
            const needStart = !start || start.year !== newStart.year || start.month !== newStart.month
            const needEnd = !end || end.year !== newEnd.year || end.month !== newEnd.month
            if (needStart) setStart(newStart)
            if (needEnd) setEnd(newEnd)

            // Do not force visibleYear while modal is open - keep user's current view
            if (visibleYear === null || openFor === null) {
                setVisibleYear(newStart.year)
            }
        }
    }, [value])

    useEffect(() => {
        if (!bounds) return
        if (start === null || end === null) {
            const s = bounds.minDate
            const e = bounds.maxDate
            setStart({ year: s.getFullYear(), month: s.getMonth() })
            setEnd({ year: e.getFullYear(), month: e.getMonth() })
            setVisibleYear(s.getFullYear())
        }
    }, [bounds])

    // Loading state: consider hook loading, parent-disabled (global fetches), and missing bounds
    const isLoading = Boolean(loading) || Boolean(disabled) || !bounds

    useEffect(() => {
        // Only close the modal when bounds are removed (data gone).
        // Do not close when global `disabled` or transient `loading` changes,
        // since we only want to disable month clicks in those cases.
        if (!bounds && openFor) {
            startClose()
        }
    }, [bounds, openFor])

    const years = useMemo(() => {
        if (!bounds) return []
        const arr = []
        const minY = bounds.minDate.getFullYear()
        const maxY = bounds.maxDate.getFullYear()
        for (let y = minY; y <= maxY; y++) arr.push(y)
        return arr
    }, [bounds])

    // Keep refs for min/max year to avoid stale-closure issues
    const minYearRef = useRef(bounds?.minDate.getFullYear() ?? new Date().getFullYear())
    const maxYearRef = useRef(bounds?.maxDate.getFullYear() ?? new Date().getFullYear())

    useEffect(() => {
        if (!bounds) return
        minYearRef.current = bounds.minDate.getFullYear()
        maxYearRef.current = bounds.maxDate.getFullYear()
        // clamp visibleYear into range when bounds change
        setVisibleYear((v) => {
            const cur = v ?? bounds.minDate.getFullYear()
            if (cur < minYearRef.current) return minYearRef.current
            if (cur > maxYearRef.current) return maxYearRef.current
            return cur
        })
    }, [bounds])

    const isMonthAvailable = (year, month) => {
        if (!bounds) return false
        const minY = bounds.minDate.getFullYear()
        const maxY = bounds.maxDate.getFullYear()
        const minM = bounds.minDate.getMonth()
        const maxM = bounds.maxDate.getMonth()
        if (year < minY || year > maxY) return false
        if (year === minY && month < minM) return false
        if (year === maxY && month > maxM) return false
        return true
    }

    const commitRange = (s, e) => {
        if (!s || !e) return
        const start_date = formatIsoDate(new Date(s.year, s.month, 1))
        const end_date = formatIsoDate(new Date(e.year, e.month, lastDayOfMonth(e.year, e.month)))
        onCommitRef.current({ start_date, end_date })
    }

    const snapRange = (r) => r ? ({ year: r.year, month: r.month }) : null

    const openForField = (which) => {
        // toggle: if same field close
        if (openFor === which) {
            startClose()
            return
        }

        // snapshot initial values for comparison on close
        initialStartRef.current = snapRange(start)
        initialEndRef.current = snapRange(end)

        // set open and visible year
        const targetYear = (which === 'start' && start) ? start.year : (which === 'end' && end) ? end.year : (years[0] ?? new Date().getFullYear())
        setOpenFor(which)
        setIsOpenedVisible(false)
        setVisibleYear(targetYear)

        // compute modal position after paint
        setTimeout(() => {
            const anchor = which === 'start' ? startAnchorRef.current : endAnchorRef.current
            const wrapper = wrapperRef.current
            const modalEl = modalRef.current
            if (!anchor || !wrapper) {
                setIsOpenedVisible(true)
                return
            }
            const aRect = anchor.getBoundingClientRect()
            const wRect = wrapper.getBoundingClientRect()
            const modalWidth = modalEl?.offsetWidth ?? 288
            let left = aRect.left - wRect.left
            if (left + modalWidth > wRect.width) left = Math.max(0, wRect.width - modalWidth)
            const top = aRect.bottom - wRect.top + 6
            setModalStyle({ top, left })
            setIsOpenedVisible(true)
        }, 0)
    }

    // close modal when clicking outside or pressing Escape
    const samePos = (a, b) => {
        if (!a && !b) return true
        if (!a || !b) return false
        return a.year === b.year && a.month === b.month
    }

    const startClose = () => {
        const startChanged = !samePos(initialStartRef.current, start)
        const endChanged = !samePos(initialEndRef.current, end)

        if ((startChanged || endChanged) && start && end) {
            commitRange(start, end)
        }

        setIsClosing(true)
        setTimeout(() => {
            setOpenFor(null)
            setIsClosing(false)
        }, 180)
    }

    useEffect(() => {
        if (!openFor) return
        const onPointerDown = (e) => {
            const target = e.target
            if (!wrapperRef.current) return
            if (!wrapperRef.current.contains(target)) {
                startClose()
            }
        }
        const onKeyDown = (e) => {
            if (e.key === 'Escape') startClose()
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [openFor, start, end])

    const handleMonthClick = (monthIdx) => {
        if (!openFor || isLoading || visibleYear === null) return

        const clicked = { year: visibleYear, month: monthIdx }

        if (openFor === 'start') {
            if (!end) return
            const cTot = clicked.year * 12 + clicked.month
            const eTot = end.year * 12 + end.month
            if (cTot <= eTot) {
                setStart(clicked)
                setVisibleYear(clicked.year)
                commitRange(clicked, end)
                return
            } else {
                // clicked is after end -> make clicked the new end
                setStart(end)
                setEnd(clicked)
                setVisibleYear(clicked.year)
                commitRange(end, clicked)
                return
            }
        }

        if (openFor === 'end') {
            if (!start) return
            const cTot = clicked.year * 12 + clicked.month
            const sTot = start.year * 12 + start.month
            if (cTot >= sTot) {
                setEnd(clicked)
                setVisibleYear(clicked.year)
                commitRange(start, clicked)
                return
            } else {
                // clicked is before start -> make clicked the new start
                setEnd(start)
                setStart(clicked)
                setVisibleYear(clicked.year)
                commitRange(clicked, start)
                return
            }
        }
    }

    const shadeFor = (y, m) => {
        if (!start || !end) return null
        const sTot = start.year * 12 + start.month
        const eTot = end.year * 12 + end.month
        const t = y * 12 + m
        if (t === sTot) return 'start'
        if (t === eTot) return 'end'
        if (t > sTot && t < eTot) return 'middle'
        return null
    }

    const prevDisabled = isLoading || !visibleYear || visibleYear <= minYearRef.current
    const nextDisabled = isLoading || !visibleYear || visibleYear >= maxYearRef.current

    // Use simple functions (no useCallback) and robustly handle null visibleYear
    const handlePrevYear = () => {
        const minY = minYearRef.current
        setVisibleYear((v) => {
            const cur = v ?? minY
            return Math.max(minY, cur - 1)
        })
    }

    const handleNextYear = () => {
        const maxY = maxYearRef.current
        setVisibleYear((v) => {
            const cur = v ?? minYearRef.current
            return Math.min(maxY, cur + 1)
        })
    }

    return {
        isLoading,
        start,
        end,
        openFor,
        visibleYear,
        isClosing,
        isOpenedVisible,
        modalStyle,
        wrapperRef,
        modalRef,
        startAnchorRef,
        endAnchorRef,
        prevDisabled,
        nextDisabled,
        isMonthAvailable,
        shadeFor,
        openForField,
        startClose,
        handleMonthClick,
        handlePrevYear,
        handleNextYear,
    }
}
