import TripFlowCorridorRow from './TripFlowCorridorRow.jsx'
import { BAR_SOLID, BAR_RUST } from '@/utils/styling'

/**
 * Ranked corridor list for the trip-flow insights panel. Rows are ordered by
 * daily rides; in split mode a small legend names the two fill tones and each
 * row shows its outbound/inbound balance. Row hover is linked to the map's
 * arc highlight through the corridor key.
 * @param {Array} rows - Ranked corridors from rankCorridors, sorted descending.
 * @param {string|null} hoveredCorridorKey - Corridor currently highlighted.
 * @param {Function} onCorridorHover - Receives a corridor key or null.
 * @param {boolean} showSplit - Whether rows render the outbound/inbound split fill.
 * @returns The rendered corridor list.
 */
export default function TripFlowCorridorList({ rows, hoveredCorridorKey, onCorridorHover, showSplit = false }) {
    const maxValue = rows.reduce((max, row) => Math.max(max, row.value), 0)

    return (
        <div className="trip-corridors">
            {showSplit && (
                <div className="trip-corridors__legend">
                    <span className="trip-corridors__legend-item">
                        <span className="trip-corridors__legend-swatch" style={{ background: BAR_SOLID }} />
                        Outbound
                    </span>
                    <span className="trip-corridors__legend-item">
                        <span className="trip-corridors__legend-swatch" style={{ background: BAR_RUST }} />
                        Inbound
                    </span>
                </div>
            )}
            <ol className="trip-corridors__list">
                {rows.map((row, index) => (
                    <TripFlowCorridorRow
                        key={row.key}
                        row={row}
                        rank={index + 1}
                        maxValue={maxValue}
                        isHovered={row.key === hoveredCorridorKey}
                        onHover={onCorridorHover}
                        showSplit={showSplit}
                    />
                ))}
            </ol>
        </div>
    )
}
