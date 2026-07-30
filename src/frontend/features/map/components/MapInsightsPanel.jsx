import InfrastructureInsights from '../infrastructure/components/InfrastructureInsights.jsx'
import StationUsageInsights from '../station_usage/components/StationUsageInsights.jsx'
import TripFlowInsights from '../trip_flow/components/TripFlowInsights.jsx'

/**
 * Layer-aware insights block under the map: renders 1-3 chart frames whose
 * content follows the active layer, aggregating only data the map layers
 * already hold client-side.
 * @param {string} activeLayer - The map's active layer key.
 * @param {Object} insights - Per-layer data slices from useBuildLayers.
 * @param {Object} tripFlowHover - Corridor hover link shared with the trip-flow arc layer.
 * @param {Object} tripFlowPin - Corridor pin link shared with the trip-flow arc layer.
 * @param {string} usageMode - Station usage mode ('all' | 'incoming' | 'outgoing').
 * @param {number} currentTime - Current time-wheel hour (fractional during animation).
 * @param {number|null} selectedYear - Selected network year, null for present.
 * @param {Function} setSelectedYear - Sets the network year filter.
 * @param {{minYear: number, maxYear: number}} yearBounds - Year slider bounds.
 * @returns The rendered insights panel for the active layer.
 */
export default function MapInsightsPanel({
    activeLayer,
    insights,
    tripFlowHover,
    tripFlowPin,
    usageMode,
    currentTime,
    selectedYear,
    setSelectedYear,
    yearBounds,
}) {
    return (
        <div className="map-insights">
            {activeLayer === 'infrastructure' && (
                <InfrastructureInsights
                    insights={insights.infrastructure}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    yearBounds={yearBounds}
                />
            )}
            {activeLayer === 'station_usage' && (
                <StationUsageInsights
                    insights={insights.stationUsage}
                    usageMode={usageMode}
                    currentTime={currentTime}
                />
            )}
            {activeLayer === 'trip_flow' && (
                <TripFlowInsights insights={insights.tripFlow} tripFlowHover={tripFlowHover} tripFlowPin={tripFlowPin} />
            )}
        </div>
    )
}
