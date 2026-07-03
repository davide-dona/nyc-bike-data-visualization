import { formatCompact } from '../../../utils/numberFormat.js'

type TooltipContext = { parsed: { y: number } }

// Utility functions for formatting tooltip labels and Y-axis ticks in the temporal stats page's charts.
export function formatTooltipLabel(format: (value: number) => string, ctx: TooltipContext) {
    return " " + format(ctx.parsed.y)
}

// Function to format Y-axis tick values based on the unit of measurement. Ride counts and
// rides/day use the shared compact form ("2k", "22.3M"); other units keep one decimal place.
export function formatYAxisTick(unit: string, value: number) {
    if (unit === "rides" || unit === "rides/day") {
        return formatCompact(value)
    }

    return Number(value).toFixed(1)
}
