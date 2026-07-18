import { formatFilterValue } from '../utils/compareLayers.js'
import useCompareFilterDropdown from '../hooks/useCompareFilterDropdown.js'

/**
 * Custom dropdown used inside the Compare panel to pick a single class filter
 * value (user type or bike type). Closes on outside click and reports the
 * selected raw value via `onChange` (empty string means "All").
 * @param {string} value - Currently selected raw filter value (empty for All).
 * @param {string[]} options - Raw options to render below the All entry.
 * @param {Function} onChange - Invoked with the newly selected value.
 * @returns {JSX.Element} Dropdown trigger + menu wrapper.
 */
export default function CompareFilterDropdown({ value, options, onChange }) {
    const { isOpen, rootRef, toggle, handleSelect } = useCompareFilterDropdown({ onChange })

    const selectedLabel = value ? formatFilterValue(value) : 'All'

    return (
        <div
            ref={rootRef}
            className={`surface-compare-select-wrap${isOpen ? ' is-open' : ''}`}
        >
            <button
                type="button"
                className="surface-compare-select"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                onClick={toggle}
            >
                <span
                    className={`surface-compare-select-value${value ? '' : ' is-placeholder'}`}
                >
                    {selectedLabel}
                </span>
                <span
                    className="surface-compare-select-chevron"
                    aria-hidden="true"
                >
                    <i className="fa-solid fa-chevron-right" />
                </span>
            </button>

            {isOpen ? (
                <div className="surface-compare-select-menu" role="listbox">
                    <button
                        type="button"
                        className={`surface-compare-select-option${value ? '' : ' is-selected'}`}
                        onClick={() => handleSelect('')}
                    >
                        All
                    </button>
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            className={`surface-compare-select-option${value === option ? ' is-selected' : ''}`}
                            onClick={() => handleSelect(option)}
                        >
                            {formatFilterValue(option)}
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    )
}
