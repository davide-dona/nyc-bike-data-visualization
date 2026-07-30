import { TEMPORAL_TEXT } from '../utils/temporalText.js'

/**
 * Collapsible list of surfaces in the compare panel: the base layer followed
 * by one row per compare layer, each with Hide/Show and Remove. The plot must
 * keep one surface, so the last visible row shows no actions at all.
 * @param {Object|null} baseLayer - The base layer (id, color, label, visible), or null once removed.
 * @param {Array<Object>} layers - Compare layers (id, color, label, visible).
 * @param {number} visibleSurfaceCount - How many surfaces are currently drawn.
 * @param {Function} onToggleVisibility - Toggles a surface's visibility by id.
 * @param {Function} onRemove - Removes a surface by id.
 * @returns The rendered surfaces list.
 */
export default function CompareLayerList({
    baseLayer,
    layers,
    visibleSurfaceCount,
    onToggleVisibility,
    onRemove,
}) {
    const surfaces = baseLayer ? [baseLayer, ...layers] : layers

    return (
        <details className="surface-layer-list" open>
            <summary>
                <span className="surface-layer-list__title">
                    {TEMPORAL_TEXT.layerList.title} ({surfaces.length})
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
                {surfaces.map((surface) => (
                    <div
                        key={surface.id}
                        className={`surface-layer-item${surface.id === baseLayer?.id ? " is-base" : ""}`}
                    >
                        <span
                            className="surface-layer-swatch"
                            style={{
                                backgroundColor: surface.color,
                            }}
                        />
                        <span className="surface-layer-name">
                            {surface.label}
                        </span>
                        {!(surface.visible && visibleSurfaceCount <= 1) && (
                            <>
                                <button
                                    type="button"
                                    className={`surface-layer-toggle${surface.visible ? " is-on" : ""}`}
                                    onClick={() => onToggleVisibility(surface.id)}
                                >
                                    <span
                                        className="surface-btn-icon"
                                        aria-hidden="true"
                                    >
                                        <i
                                            className={`fa-solid ${surface.visible ? "fa-eye-slash" : "fa-eye"}`}
                                        />
                                    </span>
                                    {surface.visible ? TEMPORAL_TEXT.layerList.hide : TEMPORAL_TEXT.layerList.show}
                                </button>
                                <button
                                    type="button"
                                    className="surface-layer-delete"
                                    onClick={() => onRemove(surface.id)}
                                >
                                    <span
                                        className="surface-btn-icon"
                                        aria-hidden="true"
                                    >
                                        <i className="fa-solid fa-trash" />
                                    </span>
                                    {TEMPORAL_TEXT.layerList.remove}
                                </button>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </details>
    )
}
