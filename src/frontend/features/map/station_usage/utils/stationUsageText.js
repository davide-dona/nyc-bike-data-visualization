// Centralized display copy for the station-usage insight frames.
export const STATION_USAGE_TEXT = {
    peakHour: {
        title: 'Stations by peak hour',
        noteLead: 'Counts stations by the hour of day when their traffic peaks, using ',
        noteTail: '. This reveals at a glance when the network is busiest.',
        xAxisTitle: 'Hour of Day',
        yAxisTitle: 'Stations peaking',
    },
    busiest: {
        title: 'Busiest stations',
        noteLead: 'Ranks the ten busiest stations by average daily rides, using ',
        noteTail: '. This highlights which individual hubs carry the heaviest daily passenger loads.',
        xAxisTitle: 'Avg rides / day',
    },
    modeNotes: {
        all: 'all rides',
        incoming: 'incoming rides only',
        outgoing: 'outgoing rides only',
    },
    speedController: {
        eyebrow: 'Time wheel',
        hint: 'Drag the wheel to adjust the time minute-by-minute, looping past midnight.',
    },
}
