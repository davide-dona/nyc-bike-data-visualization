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
 * Selector for which metric to display on the surface graph.
 * @param {string} activeMetric - The currently selected metric key.
 * @param {Function} setActiveMetric - Updates the active metric.
 * @param {boolean} [disabled=false] - Whether selector interactions are disabled.
 * @returns The rendered metric selector.
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
