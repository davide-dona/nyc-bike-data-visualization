// Shared number formatting: one source of truth for tooltips, detail values, and axis/tile figures.

const FORMAT_CACHE = new Map()

/** Returns a cached grouped Intl formatter with fixed decimals. */
function groupedFormat(decimals) {
    if (!FORMAT_CACHE.has(decimals)) {
        FORMAT_CACHE.set(decimals, new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }))
    }
    return FORMAT_CACHE.get(decimals)
}

const COMPACT_FORMAT = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

/** Apostrophe-grouped decimal: 12345.678 -> "12'345.68". */
export function formatNumber(value, decimals = 2) {
    if (!Number.isFinite(value)) return '-'
    return groupedFormat(decimals).format(value).replace(/,/g, "'")
}

/** Apostrophe-grouped integer count: 8513752 -> "8'513'752". */
export function formatCount(value) {
    return formatNumber(value, 0)
}

/** Compact human form with lowercase k: 2000 -> "2k", 22282082 -> "22.3M". */
export function formatCompact(value) {
    if (!Number.isFinite(value)) return '-'
    return COMPACT_FORMAT.format(value).replace('K', 'k')
}
