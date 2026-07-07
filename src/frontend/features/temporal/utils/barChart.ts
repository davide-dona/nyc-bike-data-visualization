import { formatCompact } from '../../../utils/numberFormat.js'

type TooltipContext = { parsed: { y: number } }

/**
 * Formats a Chart.js tooltip line for the temporal charts.
 * @param format - Formatter applied to the hovered value.
 * @param ctx - Chart.js tooltip context carrying the parsed value.
 * @returns The formatted tooltip label with its leading space.
 */
export function formatTooltipLabel(format: (value: number) => string, ctx: TooltipContext) {
    return " " + format(ctx.parsed.y)
}

/**
 * Formats a Y-axis tick based on the unit of measurement. Ride counts and
 * rides/day use the shared compact form ("2k", "22.3M"); other units keep
 * one decimal place.
 * @param unit - Metric unit (e.g. "rides", "min").
 * @param value - Tick value.
 * @returns The formatted tick string.
 */
export function formatYAxisTick(unit: string, value: number) {
    if (unit === "rides" || unit === "rides/day") {
        return formatCompact(value)
    }

    return Number(value).toFixed(1)
}
