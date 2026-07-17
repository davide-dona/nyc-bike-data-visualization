/**
 * Shared segmented button-group control used by the map layer selector, temporal metric selector, and header rider/bike filters.
 * @param {boolean} [framed=true] - When false, renders only the buttons so the host supplies the track (e.g. ScrollableButtonRow).
 */
export default function SegmentedControl({
    options,
    value,
    onChange,
    variant = 'light',
    size = 'md',
    framed = true,
    disabled = false,
    ariaLabel,
}) {
    const btnClass = [
        'segmented-control__btn',
        variant === 'dark' ? 'segmented-control__btn--dark' : '',
        size === 'sm' ? 'segmented-control__btn--sm' : '',
    ].filter(Boolean).join(' ')

    const buttons = options.map(({ value: optionValue, label, icon }) => (
        <button
            key={optionValue}
            type="button"
            className={`${btnClass}${optionValue === value ? ' active' : ''}`}
            onClick={() => onChange(optionValue)}
            disabled={disabled}
            aria-disabled={disabled}
            aria-pressed={optionValue === value}
        >
            {icon && (
                <span className="segmented-control__icon" aria-hidden="true">
                    <i className={icon} />
                </span>
            )}
            {label}
        </button>
    ))

    if (!framed) return buttons

    return (
        <div
            className={`segmented-control${variant === 'dark' ? ' segmented-control--dark' : ''}`}
            role="group"
            aria-label={ariaLabel}
            aria-disabled={disabled}
        >
            {buttons}
        </div>
    )
}
