// Editorial copy for the weather page's "How To Read It" visualization guide
export const WEATHER_GUIDE = {
    mapName: 'Weather Impact',
    title: 'How To Read It',
    summary: 'Each point links weather conditions to mobility behavior. Use the chart to identify thresholds where weather starts changing trip speed or volume in a meaningful way.',
    hints: [
        {
            title: 'Look for clusters',
            text: 'Tight clouds suggest stable behavior under similar weather, while spread-out clouds indicate more uncertainty in rider response.',
        },
        {
            title: 'Watch for breakpoints',
            text: 'Find where trends bend: a small weather change can trigger a strong drop or rise after a critical point.',
        },
        {
            title: 'Read the curves',
            text: 'The temperature curve shows how demand climbs with warmth - casual riders react more strongly than members. The rain bars show how much ridership survives each precipitation intensity relative to dry hours.',
        },
    ],
}
