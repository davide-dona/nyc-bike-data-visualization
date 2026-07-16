import SpeedController from "./SpeedController"
import BikeRoutesToggle from "./BikeRoutesToggle"
import SegmentedControl from "@/components/SegmentedControl.jsx"
import ResetButton from "./ResetButton.jsx"
import YearSlider from "./YearSlider.jsx"
import { USAGE_MODE_OPTIONS } from "../utils/mapConfig.js"

/**
 * Component for controlling the active map layer and animation settings. 
 * Provides a dropdown to select the active layer and, if the layer supports animation, includes the SpeedController for time-based animations.
 * @param {string} activeLayer - The currently active map layer.
 * @param {Function} setActiveLayer - Function to update the active layer in the parent component.
 * @param {number} currentTime - The current time in hours (can be a fractional value representing minutes) for animation purposes.
 * @param {Function} setCurrentTime - Function to update the current time in the parent component.
 * @param {boolean} hasAnimation - Indicates whether the currently active layer supports animation, which determines if the SpeedController should be displayed.
 * @param {boolean} showBikeRoutes - Whether bike routes are currently shown on the map, which is relevant for the infrastructure layer.
 * @param {Function} setShowBikeRoutes - Function to update the showBikeRoutes state in the parent component, allowing the user to toggle bike routes on the infrastructure layer.
 * @param {string} usageMode - Which metric the station usage layer encodes ('all' | 'incoming' | 'outgoing').
 * @param {Function} setUsageMode - Function to update the usageMode state in the parent component.
 * @param {string} tripDirection - Direction filter of the trip-flow focus view ('all' | 'incoming' | 'outgoing').
 * @param {Function} setTripDirection - Setter for the trip-flow direction filter.
 * @param {Function} clearTripFlowFocus - Returns the trip flow layer to the citywide overview.
 * @param {boolean} hasTripFlowFocus - Whether a station is currently focused on the trip flow layer.
 * @param {boolean} hasCorridorPin - Whether a leaderboard corridor pin is active on the trip flow layer.
 * @param {number|null} selectedYear - Historical year for the bike-route network, null for present.
 * @param {Function} setSelectedYear - Setter for the selected network year.
 * @param {Object} yearBounds - {minYear, maxYear} derived from the route data.
 * @returns
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

                {activeLayer === 'trip_flow' && (
                    <SegmentedControl
                        options={USAGE_MODE_OPTIONS}
                        value={tripDirection}
                        onChange={setTripDirection}
                        disabled={disabled || !hasTripFlowFocus}
                        ariaLabel="Trip flow direction"
                    />
                )}

                {activeLayer === 'trip_flow' && (
                    <ResetButton
                        disabled={!hasTripFlowFocus && !hasCorridorPin}
                        onClick={clearTripFlowFocus}
                    />
                )}
            </div>
        </div>
    )
}