import ScrollableButtonRow from './ScrollableButtonRow.jsx';
import SegmentedControl from '@/components/SegmentedControl.jsx';
import { FILTERS, FILTER_HINTS, formatFilterLabel, getFilterIcon } from '../utils/filterOptions.js';

/**
 * Component for filtering rides based on rider type and bike type, allowing users to select from predefined options for each filter category, with an "All" option to reset filters.
 * @param {object} value - An object containing the current filter values, where keys correspond to filter categories (e.g., user_type, bike_type) and values are the selected options for those categories.
 * @param {function} onChange - A callback function that is called when the filter values change, receiving the updated filter values as an argument.
 * @param {boolean} [disabled=false] - Whether the filter buttons are disabled.
 * @returns The rendered rider/bike filter groups.
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
