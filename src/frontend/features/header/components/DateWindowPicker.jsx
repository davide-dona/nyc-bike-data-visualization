import useDateWindowPicker from '../hooks/useDateWindowPicker.js'
import { MONTH_LABELS, MONTH_ORDER } from '@/utils/config.js'
import CalendarIcon from './CalendarIcon.jsx'
import MonthCell from './MonthCell.jsx'
import { HEADER_TEXT } from '../utils/headerText.js'

/**
 * FROM/TO month-range picker; all state and behavior live in useDateWindowPicker, this only renders.
 * @param {Object|null} value - Committed {start_date, end_date} range.
 * @param {Function} onCommit - Commits a new range.
 * @param {boolean} disabled - Parent-level disable (fetches in flight).
 * @returns The rendered picker.
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
                    <div className="dw-label">{HEADER_TEXT.dateWindow.from}</div>
                    <button ref={startAnchorRef} className="dw-input dw-input--thin" onClick={() => openForField('start')} aria-haspopup="dialog" disabled={isLoading}>
                        <span className="dw-icon"><CalendarIcon/></span>
                        <span className="dw-text">{start ? `${MONTH_ORDER[start.month]} ${start.year}` : HEADER_TEXT.dateWindow.selectStart}</span>
                    </button>
                </div>
                <div className="dw-row">
                    <div className="dw-label">{HEADER_TEXT.dateWindow.to}</div>
                    <button ref={endAnchorRef} className="dw-input dw-input--thin" onClick={() => openForField('end')} aria-haspopup="dialog" disabled={isLoading}>
                        <span className="dw-icon"><CalendarIcon/></span>
                        <span className="dw-text">{end ? `${MONTH_ORDER[end.month]} ${end.year}` : HEADER_TEXT.dateWindow.selectEnd}</span>
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
