import { stationAvailabilityLegend } from "../infrastructure/utils/stationAvailabilityLayer.js";
import { stationUsageLegend } from "../station_usage/utils/stationUsageLayer.js";
import { tripFlowLegend } from "../trip_flow/utils/tripFlowLayer.js";

/**
 * Resolves the legend descriptor (entries + optional sub-sections) for the
 * currently active layer. Each layer returns a plain `{ entries, ... }` object
 * so MapLegend can render them uniformly.
 * @param {string} activeLayer - Key of the active map layer (e.g. "station_usage").
 * @param {{ showBikeRoutes: boolean, hasTripFlowFocus: boolean }} options - Extra flags forwarded to layer-specific legend builders.
 * @returns {{ entries: Array, includeBikeRoutes?: boolean }} Legend descriptor consumed by MapLegend.
 */
export function legendFor(activeLayer, { showBikeRoutes, hasTripFlowFocus = false }) {
    switch (activeLayer) {
        case "station_usage":
            return stationUsageLegend();
        case "trip_flow":
            return tripFlowLegend(hasTripFlowFocus);
        case "infrastructure":
            return stationAvailabilityLegend({ showBikeRoutes });
        default:
            return { entries: [] };
    }
}
