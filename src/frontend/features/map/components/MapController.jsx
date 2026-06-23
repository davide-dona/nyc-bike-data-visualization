import SpeedController from "./SpeedController"
import BikeRoutesToggle from "./BikeRoutesToggle"
import UsageModeToggle from "./UsageModeToggle.jsx"
import ResetButton from "./ResetButton.jsx"

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
 * @param {Function} resetSelectedStationIds - Function to reset the selected station IDs in the trip flow layer, allowing users to clear their selection and reset the view.
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
    resetSelectedStationIds,
    hasTripFlowSelection,
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
                    <UsageModeToggle
                        usageMode={usageMode}
                        setUsageMode={setUsageMode}
                    />
                )}

                {activeLayer === 'infrastructure' && (
                    <BikeRoutesToggle
                        showBikeRoutes={showBikeRoutes}
                        setShowBikeRoutes={setShowBikeRoutes}
                    />
                )}

                {activeLayer === 'trip_flow' && (
                    <ResetButton
                        disabled={!hasTripFlowSelection}
                        onClick={() => {
                            resetSelectedStationIds()
                        }}
                    />
                )}
            </div>
        </div>
    )
}