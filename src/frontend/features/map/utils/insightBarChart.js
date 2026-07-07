import { BAR_SOLID, BAR_PINNED } from '@/utils/styling'

// Unit-separator control char: cannot appear in station names or year labels,
// so joined keys round-trip safely even when labels contain spaces.
export const KEY_SEPARATOR = '\u001f'
// Record-separator control char: joins the lines of a multi-line label inside
// a key entry, so array labels round-trip through labelsKey alongside plain
// string labels.
export const LINE_SEPARATOR = '\u001e'

// Long station/corridor names would eat the plot area on horizontal charts;
// ticks are truncated in the middle (corridor labels differ at both ends),
// tooltips keep the full label.
export const MAX_CATEGORY_TICK_CHARS = 26

/**
 * Truncates one label line in the middle to MAX_CATEGORY_TICK_CHARS.
 * @param {string} label - The label line.
 * @returns {string} The label, middle-elided when too long.
 */
const truncateLabel = (label) => {
    const text = String(label)
    if (text.length <= MAX_CATEGORY_TICK_CHARS) return text
    const half = Math.floor((MAX_CATEGORY_TICK_CHARS - 1) / 2)
    return `${text.slice(0, half)}…${text.slice(text.length - half)}`
}

/**
 * Truncates a tick label; multi-line labels arrive as arrays and each line
 * is truncated on its own so a two-line corridor label keeps both station
 * names readable.
 * @param {string|string[]} label - The tick label.
 * @returns {string|string[]} The truncated label, same shape as the input.
 */
export const truncateTickLabel = (label) =>
    Array.isArray(label) ? label.map(truncateLabel) : truncateLabel(label)

/**
 * Encodes a (possibly multi-line) label as a single string key.
 * @param {string|string[]} label - The label.
 * @returns {string} A key that round-trips through keyToLabel.
 */
export const labelToKey = (label) =>
    Array.isArray(label) ? label.join(LINE_SEPARATOR) : String(label)

/**
 * Decodes a label key back into its string or multi-line array form.
 * @param {string} key - Key produced by labelToKey.
 * @returns {string|string[]} The original label shape.
 */
export const keyToLabel = (key) =>
    key.includes(LINE_SEPARATOR) ? key.split(LINE_SEPARATOR) : key

/**
 * Builds per-bar colors for the single-series mode: the highlighted label
 * gets the amber selection color, everything else its own or the solid color.
 * @param {Array} labels - Category labels.
 * @param {string|null} highlightLabel - Label to paint in the selection color.
 * @param {Array|null} colors - Optional per-bar base colors.
 * @returns {Array<string>} One color per bar.
 */
export function buildBarColors(labels, highlightLabel, colors) {
    return labels.map((label, index) => {
        if (highlightLabel != null && label === highlightLabel) return BAR_PINNED
        return colors?.[index] ?? BAR_SOLID
    })
}

/**
 * Builds the Chart.js datasets: one dataset per group when groups are given
 * (grouped/diverging mode), otherwise a single highlighted series.
 * @param {Array} labels - Category labels.
 * @param {Array} values - Single-series values (ignored when groups is set).
 * @param {Array|null} groups - Optional [{ label, values, color }] groups.
 * @param {string|null} highlightLabel - Label painted in the selection color.
 * @param {Array|null} colors - Optional per-bar colors for the single series.
 * @returns {Array<Object>} Chart.js dataset configs.
 */
export function buildDatasets(labels, values, groups, highlightLabel, colors) {
    if (Array.isArray(groups) && groups.length > 0) {
        return groups.map((group) => ({
            label: group.label,
            data: group.values,
            backgroundColor: group.color,
            borderRadius: 0,
            borderSkipped: false,
            barPercentage: 0.86,
            categoryPercentage: 0.7,
        }))
    }
    return [{
        data: values,
        backgroundColor: buildBarColors(labels, highlightLabel, colors),
        borderRadius: 0,
        borderSkipped: false,
    }]
}
