import useNumericInput from '@/hooks/useNumericInput.js'

/** Compact numeric input: Enter/blur commits a value clamped to [min, max], Escape restores it, and an empty field commits null. */
export default function NumericInput({
    value,
    min,
    max,
    placeholder,
    onCommit,
    disabled = false,
    ariaLabel,
}) {
    const { draft, handleChange, commitDraft, handleKeyDown } = useNumericInput({
        value,
        min,
        max,
        onCommit,
    })

    return (
        <input
            type="text"
            inputMode="numeric"
            className="numeric-input"
            value={draft}
            placeholder={placeholder}
            disabled={disabled}
            aria-label={ariaLabel}
            onChange={handleChange}
            onBlur={commitDraft}
            onKeyDown={handleKeyDown}
        />
    )
}
