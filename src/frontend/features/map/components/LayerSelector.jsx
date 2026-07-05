import { LAYER_OPTIONS } from '../MapPage.jsx'
import SegmentedControl from '../../../components/SegmentedControl.jsx'

const LAYER_ICONS = {
    station_usage: 'fa-solid fa-chart-column',
    trip_flow: 'fa-solid fa-arrows-left-right',
    infrastructure: 'fa-solid fa-road',
}

const getLayerIcon = (value) => LAYER_ICONS[value] ?? 'fa-solid fa-circle'

/**
 * Button-group selector for the active map layer.
 * @param {string} activeLayer - The currently active layer value.
 * @param {Function} setActiveLayer - Callback to update the active layer.
 * @param {boolean} [disabled=false] - Whether layer buttons are disabled.
 */
export default function LayerSelector({ activeLayer, setActiveLayer, disabled = false }) {
    const options = LAYER_OPTIONS.map(({ value, label }) => ({
        value,
        label,
        icon: getLayerIcon(value),
    }))

    return (
        <SegmentedControl
            options={options}
            value={activeLayer}
            onChange={setActiveLayer}
            disabled={disabled}
            ariaLabel="Map layer"
        />
    )
}
