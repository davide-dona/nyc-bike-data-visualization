import { stationUsageTooltip } from '../station_usage/utils/stationUsageLayer.js'
import { tripArcsTooltip } from '../trip_flow/utils/tripArcsLayer.js'
import { tripStationTooltip } from '../trip_flow/utils/tripStationsLayer.js'
import { bikeRouteTooltip } from '../infrastructure/utils/bikeRoutesLayer.js'
import { stationAvailabilityTooltip } from '../infrastructure/utils/stationAvailabilityLayer.js'

/**
 * Builds the deck.gl tooltip content for the active layer and the provided object.
 * @param {Object} object - The data object associated with the hovered element on the map.
 * @param {string} activeLayer - The currently active map layer to determine tooltip content.
 * @param {string} usageMode - Usage mode of the station usage layer, used to label its metric.
 * @returns {string} The tooltip content.
 */
export default function mapTooltip({ object, activeLayer, usageMode }) {
    // To avoid errors when hovering over empty areas of the map
    if (!object) return null
    switch (activeLayer) {
        case 'station_usage':
            return stationUsageTooltip(object, usageMode)
        case 'trip_flow':
            // Distinguish between trip arcs and trip stations
            if (object.start_station_name) {
                return tripArcsTooltip(object)
            }
            return tripStationTooltip(object)
        case 'infrastructure':
            // Distinguish between station availability points and bike route segments
            if (object.geometry !== undefined) {
                return bikeRouteTooltip(object)
            }
            return stationAvailabilityTooltip(object)
        default:
            return null
    }
}