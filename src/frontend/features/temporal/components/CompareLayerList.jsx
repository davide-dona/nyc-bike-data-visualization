/**
 * Collapsible list of surfaces in the compare panel: the base layer swatch
 * plus one row per compare layer with Hide/Show and Remove actions.
 * @param {Object} baseLayer - The always-visible base layer (color, label).
 * @param {Array<Object>} layers - Compare layers (id, color, label, visible).
 * @param {Function} onToggleVisibility - Toggles a layer's visibility by id.
 * @param {Function} onRemove - Removes a layer by id.
 * @returns The rendered surfaces list.
 */
export default function CompareLayerList({ baseLayer, layers, onToggleVisibility, onRemove }) {
    return (
        <details className="surface-layer-list" open>
            <summary>
                <span className="surface-layer-list__title">
                    Surfaces ({1 + layers.length})
                </span>
                <span
                    className="surface-layer-list__hint"
                    aria-hidden="true"
                >
                    <span className="surface-layer-list__hint-open">
                        Collapse
                    </span>
                    <span className="surface-layer-list__hint-closed">
                        Expand
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
                        >
                            <span
                                className="surface-btn-icon"
                                aria-hidden="true"
                            >
                                <i
                                    className={`fa-solid ${layer.visible ? "fa-eye-slash" : "fa-eye"}`}
                                />
                            </span>
                            {layer.visible ? "Hide" : "Show"}
                        </button>
                        <button
                            type="button"
                            className="surface-layer-delete"
                            onClick={() => onRemove(layer.id)}
                        >
                            <span
                                className="surface-btn-icon"
                                aria-hidden="true"
                            >
                                <i className="fa-solid fa-trash" />
                            </span>
                            Remove
                        </button>
                    </div>
                ))}
            </div>
        </details>
    )
}
