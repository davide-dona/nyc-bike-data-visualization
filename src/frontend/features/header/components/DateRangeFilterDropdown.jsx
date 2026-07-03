import { useEffect, useState, useMemo, useRef } from 'react'
import useDateRangeBounds from '../hooks/useDateBounds.js'
import useDateRangeCommit from '../hooks/useDateRangeCommit.js'
import ScrollableButtonRow from './ScrollableButtonRow.jsx'
import { MONTH_LABELS } from '../../../utils/config.jsx'
import { MONTH_ORDER } from '../../../utils/config.jsx'


/**
 * Placeholder card shown while the dataset date range is loading or when it cannot be resolved.
 */
function PlaceholderState({ label }) {
    return (
        <div className="date-range-filter-dropdown">
            <div className="date-range-filter-dropdown__header">
                <span className="date-range-filter-dropdown__eyebrow">
                    <i className="date-range-filter-dropdown__eyebrow-icon fa-solid fa-calendar-days" aria-hidden="true" />
                    Date Window
                </span>
                <span className="date-range-filter-dropdown__value">{label}</span>
            </div>
        </div>
    )
}

/**
 * DateRangeFilterDropdown component with toggle buttons for year and month.
 * Styled like the rider/bike filter selectors.
 * @param {Object} props
 * @param {Object} props.value - The currently applied date range filter value.
 * @param {Function} props.onCommit - Callback function to commit the selected date range.
 * @param {boolean} props.disabled - Whether interactions should be disabled while data is fetching.
 * @returns JSX element representing the date range filter UI with toggles.
 */
export default function DateRangeFilterDropdown({ value, onCommit, disabled = false }) {
    const {
        bounds,
        minDate,
        totalMonths,
        maxWindowSize,
        defaultRange,
        loading,
        error,
    } = useDateRangeBounds()

    // Derive available years
    const yearRange = useMemo(() => {
        if (!bounds) return { min: 0, max: 0 }
        const minYear = bounds.minDate.getFullYear()
        const maxYear = bounds.maxDate.getFullYear()
        return { min: minYear, max: maxYear }
    }, [bounds])

    // Local state for selection
    const [startYear, setStartYear] = useState(null)
    const [startMonth, setStartMonth] = useState(null)
    const [endYear, setEndYear] = useState(null)
    const [endMonth, setEndMonth] = useState(null)
    const hasInitializedRef = useRef(false)
    const onCommitRef = useRef(onCommit)

    // Update ref when onCommit changes
    useEffect(() => {
        onCommitRef.current = onCommit
    }, [onCommit])

    // Initialize from current value
    useEffect(() => {
        if (value?.start_date && value?.end_date) {
            const parseDate = (dateStr) => {
                if (typeof dateStr === 'string') {
                    const parts = dateStr.split('-')
                    return { year: parseInt(parts[0]), month: parseInt(parts[1]) - 1 }
                }
                return null
            }
            const start = parseDate(value.start_date)
            const end = parseDate(value.end_date)
            if (start && end) {
                setStartYear(start.year)
                setStartMonth(start.month)
                setEndYear(end.year)
                setEndMonth(end.month)
            }
        }
    }, [value])

    // Initialize from default range on mount
    useEffect(() => {
        if (hasInitializedRef.current) return
        if (!value?.start_date && !value?.end_date && defaultRange && minDate) {
            hasInitializedRef.current = true
            const startIdx = defaultRange.startIndex
            const endIdx = defaultRange.endIndex
            
            const startDate = new Date(minDate.getFullYear(), minDate.getMonth() + startIdx, 1)
            const endDate = new Date(minDate.getFullYear(), minDate.getMonth() + endIdx + 1, 0)
            
            setStartYear(startDate.getFullYear())
            setStartMonth(startDate.getMonth())
            setEndYear(endDate.getFullYear())
            setEndMonth(endDate.getMonth())
            
            // Auto-apply on first initialization
            const payload = {
                start_date: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`,
                end_date: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${endDate.getDate()}`,
            }
            onCommitRef.current(payload)
        }
    }, [defaultRange, minDate, value, onCommit])

    // Generate years array
    const years = useMemo(() => {
        const arr = []
        for (let y = yearRange.min; y <= yearRange.max; y++) {
            arr.push(y)
        }
        return arr
    }, [yearRange])

    // Get available months for a specific year based on dataset bounds
    const getAvailableMonthsForYear = useMemo(() => {
        return (year) => {
            if (!bounds) return Array.from({ length: 12 }, (_, i) => i)
            
            const minYear = bounds.minDate.getFullYear()
            const maxYear = bounds.maxDate.getFullYear()
            const minMonth = bounds.minDate.getMonth()
            const maxMonth = bounds.maxDate.getMonth()
            
            if (year === minYear && year === maxYear) {
                return Array.from({ length: maxMonth - minMonth + 1 }, (_, i) => minMonth + i)
            }
            
            if (year === minYear) {
                return Array.from({ length: 12 - minMonth }, (_, i) => minMonth + i)
            }
            
            if (year === maxYear) {
                return Array.from({ length: maxMonth + 1 }, (_, i) => i)
            }
            
            return Array.from({ length: 12 }, (_, i) => i)
        }
    }, [bounds])

    // Auto-commit when all values are selected
    useEffect(() => {
        if (startYear !== null && startMonth !== null && endYear !== null && endMonth !== null && !disabled) {
            const payload = {
                start_date: `${startYear}-${String(startMonth + 1).padStart(2, '0')}-01`,
                end_date: `${endYear}-${String(endMonth + 1).padStart(2, '0')}-${new Date(endYear, endMonth + 1, 0).getDate()}`,
            }
            onCommitRef.current(payload)
        }
    }, [startYear, startMonth, endYear, endMonth, disabled])

    // Format display label
    const dateLabel = useMemo(() => {
        if (startYear === null || startMonth === null || endYear === null || endMonth === null) {
            return 'Select dates'
        }
        return `${MONTH_ORDER[startMonth]} ${startYear} - ${MONTH_ORDER[endMonth]} ${endYear}`
    }, [startYear, startMonth, endYear, endMonth])

    // Check loading and error states
    const isLoadingView = loading || !bounds
    const isUnavailableView = !isLoadingView && error

    if (isLoadingView) return <PlaceholderState label="Loading date range..." />
    if (isUnavailableView) return <PlaceholderState label="Date range unavailable" />

    const availableStartMonths = startYear !== null ? getAvailableMonthsForYear(startYear) : []
    const availableEndMonths = endYear !== null ? getAvailableMonthsForYear(endYear) : []

    return (
        <div className={`date-range-filter-dropdown${disabled ? ' date-range-filter-dropdown--disabled' : ''}`} aria-disabled={disabled}>
            {/* From section */}
            <div className="date-range-filter-dropdown__group">
                <div className="date-range-filter-dropdown__label-wrap">
                    <span className="date-range-filter-dropdown__label">From</span>
                </div>
                <div className="date-range-filter-dropdown__inputs">
                    <ScrollableButtonRow disabled={disabled}>
                        {years.map((year) => (
                            <button
                                key={`start-year-${year}`}
                                onClick={() => {
                                    setStartYear(year)
                                    const availableMonths = getAvailableMonthsForYear(year)
                                    if (startMonth !== null && !availableMonths.includes(startMonth)) {
                                        setStartMonth(availableMonths[0])
                                    }
                                }}
                                disabled={disabled || (endYear !== null && year > endYear)}
                                className={`date-range-filter-dropdown__btn${startYear === year ? ' active' : ''}`}
                            >
                                {year}
                            </button>
                        ))}
                    </ScrollableButtonRow>
                    <ScrollableButtonRow disabled={disabled}>
                        {availableStartMonths.map((idx) => (
                            <button
                                key={`start-month-${idx}`}
                                onClick={() => setStartMonth(idx)}
                                disabled={disabled || (startYear === endYear && endMonth !== null && idx > endMonth)}
                                className={`date-range-filter-dropdown__btn${startMonth === idx ? ' active' : ''}`}
                            >
                                {MONTH_ORDER[idx]}
                            </button>
                        ))}
                    </ScrollableButtonRow>
                </div>
            </div>

            {/* To section */}
            <div className="date-range-filter-dropdown__group">
                <div className="date-range-filter-dropdown__label-wrap">
                    <span className="date-range-filter-dropdown__label">To</span>
                </div>
                <div className="date-range-filter-dropdown__inputs">
                    <ScrollableButtonRow disabled={disabled}>
                        {years.map((year) => (
                            <button
                                key={`end-year-${year}`}
                                onClick={() => {
                                    setEndYear(year)
                                    const availableMonths = getAvailableMonthsForYear(year)
                                    if (endMonth !== null && !availableMonths.includes(endMonth)) {
                                        setEndMonth(availableMonths[availableMonths.length - 1])
                                    }
                                }}
                                disabled={disabled || (startYear !== null && year < startYear)}
                                className={`date-range-filter-dropdown__btn${endYear === year ? ' active' : ''}`}
                            >
                                {year}
                            </button>
                        ))}
                    </ScrollableButtonRow>
                    <ScrollableButtonRow disabled={disabled}>
                        {availableEndMonths.map((idx) => (
                            <button
                                key={`end-month-${idx}`}
                                onClick={() => setEndMonth(idx)}
                                disabled={disabled || (endYear === startYear && startMonth !== null && idx < startMonth)}
                                className={`date-range-filter-dropdown__btn${endMonth === idx ? ' active' : ''}`}
                            >
                                {MONTH_ORDER[idx]}
                            </button>
                        ))}
                    </ScrollableButtonRow>
                </div>
            </div>

        </div>
    )
}
