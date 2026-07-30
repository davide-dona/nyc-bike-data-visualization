// Centralized display copy for the trip-flow insight frames.
export const TRIP_FLOW_TEXT = {
    focus: {
        titleLead: 'Corridors of ',
        titleFallback: 'the focused station',
        note: 'Bars show daily rides relative to the busiest corridor, split by direction, with actual average daily counts on the right. Hover or click to map its flow.',
        emptyMessage: 'No trips recorded for the focused station with the current filters.',
        partnerCountLabel: 'Linked stations',
        outboundShareLabel: 'Outbound Share',
        medianDistanceLabel: 'Median trip',
    },
    overview: {
        title: 'Strongest corridors citywide',
        note: 'Bars show total volume relative to the busiest corridor, with actual average daily counts on the right. Hover or click to trace its flow.',
        emptyMessage: 'No trips recorded for the current filters.',
        corridorCountLabel: 'Corridors',
        medianDistanceLabel: 'Median corridor',
        strongestCorridorLabel: 'Strongest corridor',
    },
    legend: {
        outbound: 'Outbound',
        inbound: 'Inbound',
    },
}
