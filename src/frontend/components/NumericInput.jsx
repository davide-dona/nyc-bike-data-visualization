import useNumericInput from '@/hooks/useNumericInput.js'

/**
 * Shared compact numeric text input: type a precise value and commit it with
 * Enter or blur; the value clamps to [min, max], Escape restores the current
 * one, and an empty field commits null (the placeholder meaning, e.g.
 * "Present"). Pairs with sliders for coarse plus precise control.
 * @param {number|null} value - The committed value; null shows the placeholder.
 * @param {number} min - Minimum committable value.
 * @param {number} max - Maximum committable value.
 * @param {string} placeholder - Text shown when the value is null.
 * @param {Function} onCommit - Receives the clamped number, or null for an empty field.
 * @param {boolean} [disabled=false] - Whether the input is disabled.
 * @param {string} [ariaLabel] - Accessible name for the input.
 * @returns The rendered numeric input.
 */
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
