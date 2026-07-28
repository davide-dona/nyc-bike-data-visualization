import { TEMPORAL_TEXT } from '../utils/temporalText.js'

/**
 * Collapsible list of surfaces in the compare panel: the base layer plus one
 * row per compare layer, each with Hide/Show and (compare layers only) Remove.
 * The plot must keep one surface, so whichever row is the last visible one has
 * its actions disabled.
 * @param {Object} baseLayer - The base layer (color, label, visible).
 * @param {Array<Object>} layers - Compare layers (id, color, label, visible).
 * @param {number} visibleSurfaceCount - How many surfaces are currently shown.
 * @param {Function} onToggleVisibility - Toggles a compare layer's visibility by id.
 * @param {Function} onToggleBaseVisibility - Toggles the base layer's visibility.
 * @param {Function} onRemove - Removes a compare layer by id.
 * @returns The rendered surfaces list.
 */
export default function CompareLayerList({
    baseLayer,
    layers,
    visibleSurfaceCount,
    onToggleVisibility,
    onToggleBaseVisibility,
    onRemove,
}) {
    // A visible row is locked while it is the only surface left on the plot.
    const isLastVisible = (layer) => layer.visible && visibleSurfaceCount <= 1
    const lockedHint = TEMPORAL_TEXT.layerList.lastVisibleHint

    return (
        <details className="surface-layer-list" open>
            <summary>
                <span className="surface-layer-list__title">
                    {TEMPORAL_TEXT.layerList.title} ({1 + layers.length})
                </span>
                <span
                    className="surface-layer-list__hint"
                    aria-hidden="true"
                >
                    <span className="surface-layer-list__hint-open">
                        {TEMPORAL_TEXT.layerList.collapse}
                    </span>
                    <span className="surface-layer-list__hint-closed">
                        {TEMPORAL_TEXT.layerList.expand}
                    </span>
                </span>
                <span
                    className="surface-layer-list__chevron"
                    aria-hidden="true"
                >
                    <i className="fa-solid fa-chevron-right" />
                </span>
            </summary>
            <div className="surface-layer-list__items">
                <div className="surface-layer-item is-base">
                    <span
                        className="surface-layer-swatch"
                        style={{
                            backgroundColor: baseLayer.color,
                        }}
                    />
                    <span className="surface-layer-name">
                        {baseLayer.label}
                    </span>
                    <button
                        type="button"
                        className={`surface-layer-toggle${baseLayer.visible ? " is-on" : ""}`}
                        onClick={onToggleBaseVisibility}
                        disabled={isLastVisible(baseLayer)}
                        title={isLastVisible(baseLayer) ? lockedHint : undefined}
                    >
                        <span
                            className="surface-btn-icon"
                            aria-hidden="true"
                        >
                            <i
                                className={`fa-solid ${baseLayer.visible ? "fa-eye-slash" : "fa-eye"}`}
                            />
                        </span>
                        {baseLayer.visible ? TEMPORAL_TEXT.layerList.hide : TEMPORAL_TEXT.layerList.show}
                    </button>
                </div>

                {layers.map((layer) => (
                    <div
                        key={layer.id}
                        className="surface-layer-item"
                    >
                        <span
                            className="surface-layer-swatch"
                            style={{
                                backgroundColor: layer.color,
                            }}
                        />
                        <span className="surface-layer-name">
                            {layer.label}
                        </span>
                        <button
                            type="button"
                            className={`surface-layer-toggle${layer.visible ? " is-on" : ""}`}
                            onClick={() => onToggleVisibility(layer.id)}
                            disabled={isLastVisible(layer)}
                            title={isLastVisible(layer) ? lockedHint : undefined}
                        >
                            <span
                                className="surface-btn-icon"
                                aria-hidden="true"
                            >
                                <i
                                    className={`fa-solid ${layer.visible ? "fa-eye-slash" : "fa-eye"}`}
                                />
                            </span>
                            {layer.visible ? TEMPORAL_TEXT.layerList.hide : TEMPORAL_TEXT.layerList.show}
                        </button>
                        <button
                            type="button"
                            className="surface-layer-delete"
                            onClick={() => onRemove(layer.id)}
                            disabled={isLastVisible(layer)}
                            title={isLastVisible(layer) ? lockedHint : undefined}
                        >
                            <span
                                className="surface-btn-icon"
                                aria-hidden="true"
                            >
                                <i className="fa-solid fa-trash" />
                            </span>
                            {TEMPORAL_TEXT.layerList.remove}
                        </button>
                    </div>
                ))}
            </div>
        </details>
    )
}
