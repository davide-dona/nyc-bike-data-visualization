import SpeedController from "../station_usage/components/SpeedController"
import BikeRoutesToggle from "../infrastructure/components/BikeRoutesToggle"
import SegmentedControl from "@/components/SegmentedControl.jsx"
import ResetButton from "./ResetButton.jsx"
import YearSlider from "../infrastructure/components/YearSlider.jsx"
import { USAGE_MODE_OPTIONS } from "../utils/mapConfig.js"

/**
 * Controls for the active map layer's animation and layer-specific settings
 * (e.g. speed controller, bike-route toggle/year, usage/direction filters).
 * @param {string} activeLayer - The currently active map layer.
 * @param {number} currentTime - Current animation time in hours (fractional).
 * @param {boolean} hasAnimation - Whether the active layer supports animation (shows SpeedController).
 * @param {boolean} showBikeRoutes - Whether bike routes are shown (infrastructure layer).
 * @param {string} usageMode - Station usage metric ('all' | 'incoming' | 'outgoing').
 * @param {string} tripDirection - Direction filter of the trip-flow focus view ('all' | 'incoming' | 'outgoing').
 * @param {Function} clearTripFlowFocus - Returns the trip flow layer to the citywide overview.
 * @param {boolean} hasTripFlowFocus - Whether a station is currently focused on the trip flow layer.
 * @param {boolean} hasCorridorPin - Whether a leaderboard corridor pin is active on the trip flow layer.
 * @param {number|null} selectedYear - Historical year for the bike-route network, null for present.
 * @param {Object} yearBounds - {minYear, maxYear} derived from the route data.
 */
export default function MapController({
    activeLayer,
    currentTime,
    setCurrentTime,
    hasAnimation,
    showBikeRoutes,
    setShowBikeRoutes,
    usageMode,
    setUsageMode,
    tripDirection,
    setTripDirection,
    clearTripFlowFocus,
    hasTripFlowFocus,
    hasCorridorPin = false,
    selectedYear,
    setSelectedYear,
    yearBounds,
    disabled = false,
}) {
    return (
        <div className="map-controls">
            {hasAnimation && (
                <SpeedController
                    setCurrentTime={setCurrentTime}
                    currentTime={currentTime}
                    disabled={disabled}
                />
            )}

            <div className="map-controls__secondary">
                {activeLayer === 'station_usage' && (
                    <SegmentedControl
                        options={USAGE_MODE_OPTIONS}
                        value={usageMode}
                        onChange={setUsageMode}
                        disabled={disabled}
                        ariaLabel="Station usage metric"
                    />
                )}

                {activeLayer === 'infrastructure' && showBikeRoutes && (
                    <YearSlider
                        value={selectedYear}
                        onChange={setSelectedYear}
                        minYear={yearBounds.minYear}
                        maxYear={yearBounds.maxYear}
                        disabled={disabled}
                    />
                )}

                {activeLayer === 'infrastructure' && (
                    <BikeRoutesToggle
                        showBikeRoutes={showBikeRoutes}
                        setShowBikeRoutes={setShowBikeRoutes}
                    />
                )}

                {activeLayer === 'trip_flow' && hasTripFlowFocus && (
                    <SegmentedControl
                        options={USAGE_MODE_OPTIONS}
                        value={tripDirection}
                        onChange={setTripDirection}
                        disabled={disabled}
                        ariaLabel="Trip flow direction"
                    />
                )}

                {activeLayer === 'trip_flow' && (hasTripFlowFocus || hasCorridorPin) && (
                    <ResetButton
                        onClick={clearTripFlowFocus}
                    />
                )}
            </div>
        </div>
    )
}