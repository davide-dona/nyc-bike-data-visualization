import CompareFilterDropdown from './CompareFilterDropdown.jsx'
import { CLASS_FILTER_KEYS } from '../utils/compareLayers.js'
import { FILTERS } from '@/features/header/utils/filterOptions.js'

/**
 * The Compare toggle button plus the compare panel shell: filter dropdowns,
 * the Add Surface button with its tooltip-tracking wrapper, and the Reset
 * button. The surfaces list is passed as children so this stays render-only.
 * @param {boolean} isOpen - Whether the panel is open (pinned or hovered).
 * @param {boolean} isActive - Whether the toggle button shows its active state.
 * @param {boolean} disabled - Disables the toggle button (loading/error).
 * @param {Object} pendingLayerFilters - Draft filter values for the next layer.
 * @param {Function} onPendingFilterChange - (key, value) updates a draft filter.
 * @param {Function} onAddLayer - Pins the draft filters as a new compare layer.
 * @param {boolean} isAddDisabled - Whether the draft duplicates an existing surface.
 * @param {Function} onResetCompare - Clears all compare layers and drafts.
 * @param {boolean} canReset - Whether there is anything to reset.
 * @param {Function} onToggle - Toggles the panel open/closed.
 * @param {Function} onHoverEnter - Hover-intent enter handler (button and panel).
 * @param {Function} onHoverLeave - Hover-intent leave handler (button and panel).
 * @param {{onMouseEnter: Function, onMouseMove: Function, onMouseLeave: Function}} addLayerMouseHandlers - Tooltip tracking for the Add Surface wrapper.
 * @param {Object} buttonRef - Ref to the toggle button node.
 * @param {Object} panelRef - Ref to the panel node.
 * @param {Object} addLayerButtonRef - Ref to the Add Surface button node.
 * @param {import('react').ReactNode} children - The surfaces list.
 * @returns The rendered compare button and panel.
 */
export default function CompareControlPanel({
    isOpen,
    isActive,
    disabled,
    pendingLayerFilters,
    onPendingFilterChange,
    onAddLayer,
    isAddDisabled,
    onResetCompare,
    canReset,
    onToggle,
    onHoverEnter,
    onHoverLeave,
    addLayerMouseHandlers,
    buttonRef,
    panelRef,
    addLayerButtonRef,
    children,
}) {
    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                className={`surface-compare-btn${isActive ? " is-active" : ""}`}
                onClick={onToggle}
                onMouseEnter={onHoverEnter}
                onMouseLeave={onHoverLeave}
                disabled={disabled}
            >
                <span
                    className="surface-compare-btn__icon"
                    aria-hidden="true"
                >
                    <i className="fa-solid fa-code-compare" />
                </span>
                Compare
            </button>

            <div
                ref={panelRef}
                className={`surface-compare-panel${isOpen ? " is-open" : ""}`}
                role="dialog"
                aria-label="Compare surfaces"
                onMouseEnter={onHoverEnter}
                onMouseLeave={onHoverLeave}
            >
                <div className="surface-compare-panel__controls">
                    {CLASS_FILTER_KEYS.map((key) => (
                        <label
                            key={key}
                            className="surface-compare-field"
                        >
                            <span>{FILTERS[key].label}</span>
                            <CompareFilterDropdown
                                value={pendingLayerFilters[key]}
                                options={FILTERS[key].options}
                                onChange={(nextValue) =>
                                    onPendingFilterChange(key, nextValue)
                                }
                            />
                        </label>
                    ))}
                    <div
                        onMouseEnter={addLayerMouseHandlers.onMouseEnter}
                        onMouseMove={addLayerMouseHandlers.onMouseMove}
                        onMouseLeave={addLayerMouseHandlers.onMouseLeave}
                    >
                        <button
                            ref={addLayerButtonRef}
                            type="button"
                            className="surface-compare-add"
                            onClick={onAddLayer}
                            disabled={isAddDisabled}
                        >
                            <span
                                className="surface-btn-icon"
                                aria-hidden="true"
                            >
                                <i className="fa-solid fa-plus" />
                            </span>
                            Add Surface
                        </button>
                    </div>
                    <button
                        type="button"
                        className="surface-compare-reset"
                        onClick={onResetCompare}
                        disabled={!canReset}
                    >
                        <span
                            className="surface-btn-icon"
                            aria-hidden="true"
                        >
                            <i className="fa-solid fa-rotate-left" />
                        </span>
                        Reset
                    </button>
                </div>

                {children}
            </div>
        </>
    )
}
