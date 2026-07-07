import useDateWindowPicker from '../hooks/useDateWindowPicker.js'
import { MONTH_LABELS, MONTH_ORDER } from '@/utils/config.js'
import CalendarIcon from './CalendarIcon.jsx'
import MonthCell from './MonthCell.jsx'

import '../styles/date-window-picker.css'

/**
 * FROM/TO month-range picker in the header: two input buttons that open a
 * year-paged month grid modal. All behavior lives in useDateWindowPicker;
 * this component only renders its state.
 * @param {Object|null} value - The committed {start_date, end_date} range.
 * @param {Function} onCommit - Commits a {start_date, end_date} range.
 * @param {boolean} disabled - Parent-level disable (global fetches in flight).
 * @returns The rendered date window picker.
 */
export default function DateWindowPicker({ value, onCommit, disabled = false }) {
    const {
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
    } = useDateWindowPicker({ value, onCommit, disabled })

    return (
        <div className="date-window-picker font-mono" ref={wrapperRef}>
            <div className="dw-inputs">
                <div className="dw-row">
                    <div className="dw-label">FROM</div>
                    <button ref={startAnchorRef} className="dw-input dw-input--thin" onClick={() => openForField('start')} aria-haspopup="dialog" disabled={isLoading}>
                        <span className="dw-icon"><CalendarIcon/></span>
                        <span className="dw-text">{start ? `${MONTH_ORDER[start.month]} ${start.year}` : 'Select start'}</span>
                    </button>
                </div>
                <div className="dw-row">
                    <div className="dw-label">TO</div>
                    <button ref={endAnchorRef} className="dw-input dw-input--thin" onClick={() => openForField('end')} aria-haspopup="dialog" disabled={isLoading}>
                        <span className="dw-icon"><CalendarIcon/></span>
                        <span className="dw-text">{end ? `${MONTH_ORDER[end.month]} ${end.year}` : 'Select end'}</span>
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
