import { toRgba } from "@/utils/color.js"
import { BAR_SOLID, BAR_MUTED, BAR_PINNED } from "@/utils/styling"

/**
 * Builds per-bar colors for a highlighted series: the pinned label gets the
 * amber selection color, the highlighted label the solid color, the rest the
 * muted color (or everything solid when nothing is highlighted).
 * @param {Array} labels - Category labels.
 * @param {string|null} highlight - Label of the hover-highlighted bar.
 * @param {string} solidColor - Color of highlighted (or all) bars.
 * @param {string} mutedColor - Color of non-highlighted bars while highlighting.
 * @param {string|null} selectedLabel - Label of the pinned bar.
 * @returns {Array<string>} One color per bar.
 */
export function buildHighlightColors(labels, highlight, solidColor, mutedColor, selectedLabel) {
    return labels.map((label) => {
        if (selectedLabel != null && label === selectedLabel) return BAR_PINNED
        if (!highlight) return solidColor
        return label === highlight ? solidColor : mutedColor
    })
}

/**
 * Builds per-bar colors for one dataset: editorial solid/muted colors in
 * single mode, or the compare layer's own color at solid/muted alphas when
 * compare datasets are shown.
 * @param {Array} labels - Category labels.
 * @param {string|null} highlight - Label of the hover-highlighted bar.
 * @param {Array|null} compareDatasets - Compare layers ({color}) or null in single mode.
 * @param {number} datasetIndex - Index of the dataset being colored.
 * @param {string|null} selectedLabel - Label of the pinned bar.
 * @returns {Array<string>} One color per bar.
 */
export function buildDatasetColors(labels, highlight, compareDatasets, datasetIndex, selectedLabel) {
    if (!compareDatasets) {
        return buildHighlightColors(labels, highlight, BAR_SOLID, BAR_MUTED, selectedLabel)
    }
    const baseColor = compareDatasets[datasetIndex]?.color ?? BAR_SOLID
    return buildHighlightColors(labels, highlight, toRgba(baseColor, 0.86), toRgba(baseColor, 0.32), selectedLabel)
}
