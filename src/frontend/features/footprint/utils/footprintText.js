// Centralized display copy for the footprint page; mirrors footprintGuide.js (per-factor data stays in emissionFactors.js).
export const FOOTPRINT_TEXT = {
    page: {
        eyebrow: 'Environmental Impact',
        title: 'Turning pedal power into a healthier planet.',
        subtitle: 'See how kilometers translate to the environment using realistic ranges and transparent math.',
    },
    tiles: {
        distanceLabel: 'Distance ridden',
        avoidedLabel: 'Avoided',
        tripsLabel: 'Car trips replaced',
    },
    modeComparison: {
        title: 'Comparative Emissions by Transport Mode',
        note: 'Displays the estimated CO2 emissions generated if the same distance were traveled using alternative modes of transport.',
        emptyMessage: 'No ride data available for this filter range.',
    },
    equivalents: {
        title: 'What that CO2 equals',
        note: 'Translates the avoided CO2 at your selected rate into everyday yearly equivalents, with each icon marking a share that rescales with your selected date range.',
        emptyMessage: 'No ride data available for this filter range.',
    },
    cumulativeBand: {
        title: 'Cumulative CO2 avoided',
        note: 'Shows the range of potential CO2 savings based on different car-substitution estimates, with the dotted line highlighting your selected rate.',
        emptyMessage: 'No daily stats available for this selection.',
    },
    assumptions: {
        title: 'Assumptions, stated explicitly',
        emissionRatesHeading: 'Travel Emission Rates',
        emissionRatesIntro: 'To calculate emissions, we use standard, real-world averages for each type of transport:',
        carReplacementHeading: 'Car Replacement Range',
        carReplacementText: "When people ride bikes, they aren't always replacing a car trip. They might have otherwise walked, caught the bus, or stayed home. That is why we show avoided CO2 as a range of possibilities, not a single, perfect number.",
        exclusionsHeading: 'Calculation Exclusions',
        exclusionsIntro: 'While we calculate direct travel savings, our current estimates do not account for the following factors:',
    },
}
