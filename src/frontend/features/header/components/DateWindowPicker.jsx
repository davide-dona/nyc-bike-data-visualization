import React, { useEffect, useMemo, useRef, useState } from 'react'
import useDateRangeBounds from '../hooks/useDateBounds.js'
import { MONTH_LABELS } from '../../../utils/config.jsx'

import '../styles/date-window-picker.css'

function CalendarIcon() {
    return <i className="fa-solid fa-calendar-days" aria-hidden="true" />
}

function MonthCell({ monthIdx, label, disabled, shade, onClick, active }) {
    const className = [
        'dw-month-cell',
        disabled ? ' disabled' : '',
        shade === 'start' ? ' shade-start' : '',
        shade === 'end' ? ' shade-end' : '',
        shade === 'middle' ? ' shade-mid' : '',
        active ? ' active' : '',
    ].join('')

    return (
        <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            className={className}
            onClick={(e) => { if (disabled) return; onClick?.(e) }}
        >
            {label}
        </div>
    )
}

export default function DateWindowPicker({ value, onCommit, disabled = false }) {
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

            // Do not force visibleYear while modal is open — keep user's current view
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
        const start_date = `${s.year}-${String(s.month+1).padStart(2,'0')}-01`
        const lastDay = new Date(e.year, e.month+1, 0).getDate()
        const end_date = `${e.year}-${String(e.month+1).padStart(2,'0')}-${lastDay}`
        onCommitRef.current({ start_date, end_date })
    }

    // Drag support removed: month selection uses clicks only

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

    const shadeFor = (y,m) => {
        if (!start || !end) return null
        const sTot = start.year*12 + start.month
        const eTot = end.year*12 + end.month
        const t = y*12 + m
        if (t === sTot) return 'start'
        if (t === eTot) return 'end'
        if (t > sTot && t < eTot) return 'middle'
        return null
    }

    const minYear = minYearRef.current
    const maxYear = maxYearRef.current
    const prevDisabled = isLoading || !visibleYear || visibleYear <= minYear
    const nextDisabled = isLoading || !visibleYear || visibleYear >= maxYear

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

    return (
        <div className="date-window-picker font-mono" ref={wrapperRef}>
            <div className="dw-inputs">
                <div className="dw-row">
                    <div className="dw-label">FROM</div>
                    <button ref={startAnchorRef} className="dw-input dw-input--thin" onClick={() => openForField('start')} aria-haspopup="dialog" disabled={isLoading}>
                        <span className="dw-icon"><CalendarIcon/></span>
                        <span className="dw-text">{start ? `${MONTH_LABELS[start.month]} ${start.year}` : 'Select start'}</span>
                    </button>
                </div>
                <div className="dw-row">
                    <div className="dw-label">TO</div>
                    <button ref={endAnchorRef} className="dw-input dw-input--thin" onClick={() => openForField('end')} aria-haspopup="dialog" disabled={isLoading}>
                        <span className="dw-icon"><CalendarIcon/></span>
                        <span className="dw-text">{end ? `${MONTH_LABELS[end.month]} ${end.year}` : 'Select end'}</span>
                    </button>
                </div>
            </div>

            {openFor && visibleYear !== null && (
                <div ref={modalRef} style={{ top: modalStyle.top !== null ? `${modalStyle.top}px` : undefined, left: modalStyle.left !== null ? `${modalStyle.left}px` : undefined }} className={`dw-modal ${isClosing ? 'dw-modal--closing' : isOpenedVisible ? 'dw-modal--open' : ''}`} role="dialog" onClick={(e) => { if (e.target === modalRef.current) startClose() }}>
                    <div className="dw-topbar">
                        <button className="dw-year-nav" onClick={handlePrevYear} aria-label="Previous year" disabled={prevDisabled} aria-disabled={prevDisabled}><i className="fa-solid fa-chevron-left" aria-hidden="true"/></button>
                        <div className="dw-year-label">{visibleYear}</div>
                        <button className="dw-year-nav" onClick={handleNextYear} aria-label="Next year" disabled={nextDisabled} aria-disabled={nextDisabled}><i className="fa-solid fa-chevron-right" aria-hidden="true"/></button>
                    </div>
                    <div className="dw-grid">
                        {Array.from({ length: 12 }, (_, i) => {
                            const shade = shadeFor(visibleYear, i)
                            const cellTot = visibleYear * 12 + i
                            const endTot = end ? (end.year * 12 + end.month) : null
                            const startTot = start ? (start.year * 12 + start.month) : null
                            const disabledByOtherBound = (
                                (openFor === 'start' && endTot !== null && cellTot > endTot) ||
                                (openFor === 'end' && startTot !== null && cellTot < startTot)
                            )
                            const disabledCell = isLoading || !isMonthAvailable(visibleYear, i) || disabledByOtherBound
                            return (
                                <MonthCell
                                    key={`m-${visibleYear}-${i}`}
                                    monthIdx={i}
                                    label={MONTH_LABELS[i]}
                                    disabled={disabledCell}
                                    shade={shade}
                                    active={!!shade}
                                    
                                    onClick={() => handleMonthClick(i)}
                                />
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
