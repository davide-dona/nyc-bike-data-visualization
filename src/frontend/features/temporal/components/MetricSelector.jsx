import { METRICS } from "../utils/metricFormatter.js"
import SegmentedControl from '../../../components/SegmentedControl.jsx'

const METRIC_ICONS = {
    total_rides: 'fa-solid fa-calendar-day',
    average_duration_minutes: 'fa-solid fa-hourglass-half',
    average_speed_kmh: 'fa-solid fa-gauge-high',
    average_distance: 'fa-solid fa-route',
}

/**
 * Resolves the Font Awesome icon for a metric key.
 * @param {string} key - Metric key.
 * @returns {string} Icon class, with a circle fallback.
 */
const getMetricIcon = (key) => METRIC_ICONS[key] ?? 'fa-solid fa-circle'

/**
 * Component for selecting which metric to display on the surface graph.
 * @param {Object} activeMetric - The currently selected metric key, used to determine which metric is active and should be highlighted in the UI.
 * @param {Function} setActiveMetric - Function to update the active metric in the parent component when a new metric is selected by the user.
 * @param {boolean} [disabled=false] - Whether selector interactions are disabled.
 * @returns
 */
function MetricSelector({activeMetric, setActiveMetric, disabled = false}) {
    const options = Object.entries(METRICS).map(([key, config]) => ({
        value: key,
        label: config.label,
        icon: getMetricIcon(key),
    }))

    return (
        <SegmentedControl
            options={options}
            value={activeMetric}
            onChange={setActiveMetric}
            disabled={disabled}
            ariaLabel="Surface metric"
        />
    )
}

export default MetricSelector
