import InfrastructureInsights from './InfrastructureInsights.jsx'
import StationUsageInsights from './StationUsageInsights.jsx'
import TripFlowInsights from './TripFlowInsights.jsx'

/**
 * Layer-aware insights block under the map: renders 1-3 chart frames whose
 * content follows the active layer, aggregating only data the map layers
 * already hold client-side.
 * @param {string} activeLayer - The map's active layer key.
 * @param {Object} insights - Per-layer data slices from useBuildLayers.
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
                <TripFlowInsights insights={insights.tripFlow} />
            )}
        </div>
    )
}
