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
            },
            {
                mapType: 'Station Usage',
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
        summary: 'This layer maps station capacities and bike-route types. Use it to examine how cycling infrastructure is structured and distributed across the city. As default, the map shows the live availability of bikes and docks at each station',
        hints: [
            {
                mapType: 'Infrastructure',
                title: 'Station Insights',
                text: 'Click any station to open a sidebar displaying real-time dock availability, historical data, and flow demand, with map markers color-coded to reflect each station\'s current status.',
            },
            {
                mapType: 'Infrastructure',
                title: 'Bike Routes',
                text: 'Use the bike route toggle to see how the city\'s cycling infrastructure is distributed and connected, with color-coded routes indicating their type.',
            },
            {
                mapType: 'Infrastructure',
                title: 'Historical Bike Routes Insights',
                text: 'Use the year slider to explore the evolution of the city\'s cycling infrastructure, paired with plots highlighting the segments added and removed each year.',
            },
        ],
    },
}
