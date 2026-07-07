import { LAYER_OPTIONS } from "../utils/mapConfig.js";
import LegendRow from "./LegendRow.jsx";
import { legendFor, bikeRoutesLegend } from "../utils/mapLegend.js";

/**
 * Map legend panel - renders the active layer's swatch rows on an ink card.
 * On the infrastructure layer the rows double as per-category visibility
 * toggles; every other layer's legend stays static.
 * @param {string} activeLayer - Key of the layer whose legend should be displayed.
 * @param {boolean} showBikeRoutes - When true, an extra bike-routes section is surfaced.
 * @param {Set} hiddenHealthCategories - Station health categories currently hidden on the map.
 * @param {Set} hiddenRouteClasses - Bike-route facility classes currently hidden on the map.
 * @param {Function} onToggleHealthCategory - Toggles one health category's visibility.
 * @param {Function} onToggleRouteClass - Toggles one facility class's visibility.
 * @returns {JSX.Element} Legend panel for the current map layer.
 */
export default function MapLegend({
    activeLayer,
    showBikeRoutes,
    hiddenHealthCategories,
    hiddenRouteClasses,
    onToggleHealthCategory,
    onToggleRouteClass,
    className = '',
}) {
    const activeLayerLabel = LAYER_OPTIONS.find((layer) => layer.value === activeLayer)?.label || "Layer";
    const legend = legendFor(activeLayer, { showBikeRoutes });
    const isInfrastructure = activeLayer === "infrastructure";

    return (
        <div className={`map-legend-${activeLayerLabel == "Station usage" ? "bottom-right" : "top-left"}${className ? ` ${className}` : ''}`}>
            <p className="map-legend-title">{activeLayerLabel}</p>
            <ul className="map-legend__list">
                {legend.entries.map(({ key, ...entry }) => (
                    <LegendRow
                        key={key ?? entry.label}
                        {...entry}
                        onToggle={isInfrastructure && onToggleHealthCategory
                            ? () => onToggleHealthCategory(key)
                            : undefined}
                        isHidden={Boolean(hiddenHealthCategories?.has(key))}
                    />
                ))}
            </ul>
            {legend.includeBikeRoutes && (
                <div className="map-legend__section">
                    <small className="map-legend__section-label">Bike routes</small>
                    <ul className="map-legend__list">
                        {bikeRoutesLegend().entries.map(({ key, ...entry }) => (
                            <LegendRow
                                key={key}
                                {...entry}
                                onToggle={isInfrastructure && onToggleRouteClass
                                    ? () => onToggleRouteClass(key)
                                    : undefined}
                                isHidden={Boolean(hiddenRouteClasses?.has(key))}
                            />
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
