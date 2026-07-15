const USAGE_MODE_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'incoming', label: 'Incoming' },
    { value: 'outgoing', label: 'Outgoing' },
]

/**
 * Segmented control for choosing which metric the station usage layer encodes.
 * @param {string} usageMode - The currently selected usage mode ('all' | 'incoming' | 'outgoing').
 * @param {Function} setUsageMode - Function to update the usageMode state in the parent component.
 * @param {boolean} [disabled=false] - Whether the usage mode buttons are disabled.
 * @returns
 */
export default function UsageModeToggle({ usageMode, setUsageMode, disabled = false }) {
    return (
        <div role="radiogroup" aria-label="Station usage metric" aria-disabled={disabled}>
            {USAGE_MODE_OPTIONS.map(({ value, label }) => (
                <button
                    key={value}
                    type="button"
                    className={`map-toggle-button${usageMode === value ? ' is-active' : ''}`}
                    aria-pressed={usageMode === value}
                    aria-label={`Show ${label.toLowerCase()} rides`}
                    onClick={() => setUsageMode(value)}
                    disabled={disabled}
                >
                    <span className="map-toggle-button__label">{label}</span>
                </button>
            ))}
        </div>
    )
}
