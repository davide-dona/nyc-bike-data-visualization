import ScrollableButtonRow from './ScrollableButtonRow.jsx';
import SegmentedControl from '../../../components/SegmentedControl.jsx';

export const FILTERS = {
  user_type: { label: 'User Type', options: ['member', 'casual'] },
  bike_type: { label: 'Bike Type', options: ['classic_bike', 'electric_bike'] },
};

const FILTER_HINTS = {
  user_type: 'Categories: Member (subscribed riders) and Casual (single-ride or pass users). Use All to include both groups.',
  bike_type: 'Categories: Classic Bike and Electric Bike. Use All to compare the combined behavior of both bike types.',
};

/**
 * Turns a snake_case option value into a title-case label.
 * @param {string} value - Option value (e.g. "classic_bike").
 * @returns {string} The display label (e.g. "Classic Bike").
 */
const formatLabel = (value) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const FILTER_OPTION_ICONS = {
  all: 'fa-solid fa-globe',
  member: 'fa-solid fa-id-card',
  casual: 'fa-solid fa-user',
  classic_bike: 'fa-solid fa-bicycle',
  electric_bike: 'fa-solid fa-bolt',
};

/**
 * Resolves the Font Awesome icon for a filter option.
 * @param {string} option - Filter option value.
 * @returns {string} Icon class, with the globe fallback.
 */
const getFilterIcon = (option) => FILTER_OPTION_ICONS[option] ?? FILTER_OPTION_ICONS.all;

/**
 * Component for filtering rides based on rider type and bike type, allowing users to select from predefined options for each filter category, with an "All" option to reset filters.
 * @param {object} value - An object containing the current filter values, where keys correspond to filter categories (e.g., user_type, bike_type) and values are the selected options for those categories.
 * @param {function} onChange - A callback function that is called when the filter values change, receiving the updated filter values as an argument.
 * @returns
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
                ...options.map((opt) => ({ value: opt, label: formatLabel(opt), icon: getFilterIcon(opt) })),
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
