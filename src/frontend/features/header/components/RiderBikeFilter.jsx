import ScrollableButtonRow from './ScrollableButtonRow.jsx';
import SegmentedControl from '@/components/SegmentedControl.jsx';
import { FILTERS, FILTER_HINTS, formatFilterLabel, getFilterIcon } from '../utils/filterOptions.js';

/**
 * Filter control for rider type and bike type, with an "All" option per category.
 * @param {object} value - Current filter values keyed by category.
 * @param {function} onChange - Called with the updated filter values.
 * @param {boolean} [disabled=false] - Disables the filter buttons.
 * @returns The rendered filter groups.
 */
export default function RiderBikeFilter({ value = {}, onChange, disabled = false }) {
  return (
    <div className={`rider-filter${disabled ? ' rider-filter--disabled' : ''}`} aria-disabled={disabled}>
      {Object.entries(FILTERS).map(([key, { label, options }]) => (
        <div className="rider-filter-group" key={key}>
          <div className="rider-filter-label-wrap">
            <span className="rider-filter-label">{label}</span>
            <button
              type="button"
              className="rider-filter-help"
              aria-label={`${label} filter info`}
              aria-describedby={`rider-filter-hint-${key}`}
              disabled={disabled}
            >
              ?
              <span id={`rider-filter-hint-${key}`} className="rider-filter-tooltip" role="tooltip">
                {FILTER_HINTS[key]}
              </span>
            </button>
          </div>
          <ScrollableButtonRow disabled={disabled}>
            <SegmentedControl
              framed={false}
              variant="dark"
              size="sm"
              options={[
                { value: '', label: 'All', icon: getFilterIcon('all') },
                ...options.map((opt) => ({ value: opt, label: formatFilterLabel(opt), icon: getFilterIcon(opt) })),
              ]}
              value={value[key] ?? ''}
              onChange={(selected) => onChange({ ...value, [key]: selected || undefined })}
              disabled={disabled}
            />
          </ScrollableButtonRow>
        </div>
      ))}
    </div>
  );
}
