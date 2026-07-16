// Editorial copy for the per-layer "How To Read It" visualization guide
export const MAP_LAYER_GUIDES = {
    station_usage: {
        mapName: 'Station Usage',
        title: 'How To Read It',
        summary: 'This 3D heatmap shows how busy each station is, with height reflecting traffic volume. Use it to spot local demand peaks and where bike pressure concentrates over time.',   
        hints: [
            {
                mapType: 'Station Usage',
                title: 'Follow hour pulses',
                text: 'Drag the time wheel from morning to evening and watch which areas light up.',
                title: 'Follow hour pulses',
                text: 'Drag the time wheel from morning to evening and watch which areas light up.',
            },
            {
                mapType: 'Station Usage',
                title: 'Incoming vs outgoing',
                text: 'Use the mode selector to see whether a station is mostly a source or destination of trips, and how that changes over the day.',
                title: 'Incoming vs outgoing',
                text: 'Use the mode selector to see whether a station is mostly a source or destination of trips, and how that changes over the day.',
            },
            {
                mapType: 'Station Usage',
                title: 'Use pause for anomalies',
                text: 'Pause on unusual spikes and inspect nearby stations to see if the pattern is isolated or part of a broader trend.',
            },
        ],
    },
    trip_flow: {
        mapName: 'Trip Flow',
        title: 'How To Read It',
        summary: 'This layer shows the busiest paths between stations. It starts with a citywide overview of major transit corridors, which you can filter down to any single station to see its directional traffic.',
        hints: [
            {
                mapType: 'Trip Flow',
                title: 'Spot major corridors',
                text: 'Look at the default citywide view to instantly see the primary routes carrying the majority of the city\'s riders.',
            },
            {
                mapType: 'Trip Flow',
                title: 'Analyze a single station',
                text: 'Click any station to isolate its links and see its primary connection partners across the network.',
            },
            {
                mapType: 'Trip Flow',
                title: 'Check net flow',
                text: 'Look at the color split to see if the station acts as a net source (outbound) or net destination (inbound) for trips.',            
            },
        ],
    },
    infrastructure: {
        mapName: 'Infrastructure',
        title: 'How To Read It',
        summary: 'This layer focuses on station capacity and bike-route context. Use it to evaluate where infrastructure appears balanced or potentially undersized versus demand.',
        hints: [
            {
                mapType: 'Infrastructure',
                title: 'Toggle routes strategically',
                text: 'Enable bike routes to assess whether high-capacity stations are supported by route coverage, then disable to inspect station signals without clutter.',
            },
            {
                mapType: 'Infrastructure',
                title: 'Check capacity clusters',
                text: 'Look for areas where many nearby stations show similar capacity levels. Uniform clusters often reflect planning zones or network hierarchy.',
            },
            {
                mapType: 'Infrastructure',
                title: 'Pair with usage insights',
                text: 'Use this layer after Station usage: places with repeated pressure and modest infrastructure are prime candidates for deeper operational analysis.',
            },
        ],
    },
}
