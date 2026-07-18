import TripFlowCorridorRow from './TripFlowCorridorRow.jsx'
import { BAR_SOLID, BAR_RUST } from '@/utils/styling'
import { RIDE_METRIC_LABELS } from '@/utils/rideMetricLabels.js'
import { TRIP_FLOW_TEXT } from '../utils/tripFlowText.js'

/**
 * Ranked corridor list for the trip-flow insights panel, ordered by daily rides.
 * Row hover links to the map's arc highlight via corridor key; a row click pins its corridor on the map.
 * @param {Array} rows - Ranked corridors from rankCorridors, sorted descending.
 * @param {string|null} hoveredCorridorKey - Corridor currently highlighted.
 * @param {Function} onCorridorHover - Receives a corridor key or null.
 * @param {string|null} pinnedCorridorKey - Corridor currently pinned on the map.
 * @param {Function} onCorridorToggle - Receives a corridor key, toggling its pin.
 * @param {boolean} showSplit - Whether rows render the outbound/inbound split fill.
 * @returns The rendered corridor list.
 */
export default function TripFlowCorridorList({
    rows,
    hoveredCorridorKey,
    onCorridorHover,
    pinnedCorridorKey = null,
    onCorridorToggle = () => {},
    showSplit = false,
}) {
    const maxValue = rows.reduce((max, row) => Math.max(max, row.value), 0)

    return (
        <div className="trip-corridors">
            {showSplit && (
                <div className="trip-corridors__legend">
                    <span className="trip-corridors__legend-item">
                        <span className="trip-corridors__legend-swatch" style={{ background: BAR_SOLID }} />
                        {TRIP_FLOW_TEXT.legend.outbound}
                    </span>
                    <span className="trip-corridors__legend-item">
                        <span className="trip-corridors__legend-swatch" style={{ background: BAR_RUST }} />
                        {TRIP_FLOW_TEXT.legend.inbound}
                    </span>
                </div>
            )}
            <p className="trip-corridors__caption">{RIDE_METRIC_LABELS.perDay.label}</p>
            <ol className="trip-corridors__list">
                {rows.map((row, index) => (
                    <TripFlowCorridorRow
                        key={row.key}
                        row={row}
                        rank={index + 1}
                        maxValue={maxValue}
                        isHovered={row.key === hoveredCorridorKey}
                        isPinned={row.key === pinnedCorridorKey}
                        onHover={onCorridorHover}
                        onToggle={onCorridorToggle}
                        showSplit={showSplit}
                    />
                ))}
            </ol>
        </div>
    )
}
