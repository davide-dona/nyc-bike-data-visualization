// Centralized display copy for the weather page; mirrors weatherGuide.js (per-code/series data stays in wmoCodeHandler.js and the config utils).
export const WEATHER_TEXT = {
    page: {
        eyebrow: 'Weather',
        title: 'When the sky decides.',
        subtitle: 'How users habits respond to the weather.',
    },
    scatter: {
        title: 'Weather conditions - speed vs trip frequency',
        note: 'The placement and coloring of the points reveal how different weather conditions affect rider behavior. Hover over any point to see its exact weather conditions and metrics.',
    },
    ridgeline: {
        title: 'Weather distributions',
        dimensionByHour: 'By Hour',
        dimensionByWeekday: 'By Weekday',
        emptyMessage: 'No weather distributions available for this filter range.',
        noteLead: 'Each ridge traces ',
        notePerHour: 'average rides per hour',
        notePerDay: 'average rides per day',
        noteTail: ' under that weather condition, normalized to its own peak so rare and common conditions are equally comparable. Hover for the exact value.',
    },
    temperatureResponse: {
        title: 'Temperature response - avg rides per hour',
        note: 'Lines track how hourly demand climbs with temperature for each rider group, showing different behaviour patterns between members and casual riders.',
        emptyMessage: 'No temperature data available for this filter range.',
    },
    rainImpact: {
        title: 'Rain impact - ridership vs dry baseline',
        note: 'Bars compare hourly ridership under each rain intensity compared to the dry-weather baseline (100%), showing how rain reduces ridership.',
        emptyMessage: 'No precipitation data available for this filter range.',
    },
    tooltip: {
        activity: 'Activity',
        observedHours: 'Observed hours:',
        journeyFeel: 'Journey feel',
        typicalDuration: 'Typical duration:',
        typicalDistance: 'Typical distance:',
        typicalSpeed: 'Typical speed:',
    },
}
