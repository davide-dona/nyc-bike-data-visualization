// Operational emission factors (g CO2e per passenger-km), surfaced verbatim in the assumptions box, so keep label/source strings user-readable.

// US EPA: 404 g CO2/mile ≈ 251 g/km for a solo-driven car trip.
const CAR_G_PER_KM = 251

// Citation metadata for every source: label links to url, with title/year/summary shown in a hover tooltip.
export const CITATIONS = {
    epaVehicle: {
        label: 'US EPA',
        url: 'https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle',
        title: 'Greenhouse Gas Emissions from a Typical Passenger Vehicle',
        year: 2023,
        summary: 'Reference figure of about 404 g CO2 per mile (~251 g/km) for the average gasoline passenger vehicle, based on typical fuel economy and annual mileage.',
    },
    henaoMarshall2019: {
        label: 'Henao & Marshall, 2019',
        url: 'https://link.springer.com/article/10.1007/s11116-018-9923-2',
        title: 'The impact of ride-hailing on vehicle miles traveled',
        year: 2019,
        summary: 'Denver field study finding ride-hail drivers spend roughly 41% of miles empty ("deadheading") between fares, inflating per-passenger emissions versus a private car trip.',
    },
    ftaClimate2010: {
        label: 'Federal Transit Administration',
        url: 'https://rosap.ntl.bts.gov/view/dot/55971',
        title: "Public Transportation's Role in Responding to Climate Change",
        year: 2010,
        summary: 'FTA emissions-per-passenger-mile figures for US transit modes, showing bus and rail well below a single-occupant car.',
    },
    epaEgrid: {
        label: 'US EPA eGRID',
        url: 'https://www.epa.gov/egrid',
        title: 'Emissions & Generation Resource Integrated Database (eGRID)',
        year: 2023,
        summary: 'EPA database of average US power-grid carbon intensity, used here to price the electricity an e-bike battery or an LED bulb draws.',
    },
    cherryWeinert2009: {
        label: 'Cherry, Weinert & Xinmiao, 2009',
        url: 'https://ideas.repec.org/p/cdl/itsdav/qt16k918sh.html',
        title: 'Comparative Environmental Impacts of Electric Bikes in China',
        year: 2009,
        summary: "Study quantifying e-bike per-km energy use and emissions directly, finding them far below cars and motorcycles - the basis for treating an e-bike's own electricity draw as small.",
    },
    fishman2014: {
        label: 'Fishman, Washington & Haworth, 2014',
        url: 'https://www.sciencedirect.com/science/article/abs/pii/S1361920914000480',
        title: "Bike share's impact on car use: Evidence from the United States, Great Britain, and Australia",
        year: 2014,
        summary: 'Multi-city analysis finding bike-share trips replace a car trip roughly 2-25% of the time, varying widely by city.',
    },
    campbellBrakewood2017: {
        label: 'Campbell & Brakewood, 2017',
        url: 'https://www.sciencedirect.com/science/article/abs/pii/S0965856416304967',
        title: 'Sharing riders: How bikesharing impacts bus ridership in New York City',
        year: 2017,
        summary: "NYC natural-experiment study linking Citi Bike's rollout to a small drop in nearby bus ridership, consistent with some bike trips substituting for other modes.",
    },
    epaTreeEquivalency: {
        label: 'US EPA',
        url: 'https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references',
        title: 'Greenhouse Gas Equivalencies Calculator - Calculations and References',
        year: 2024,
        summary: 'EPA methodology estimating about 0.060 metric tons of CO2 sequestered per urban tree seedling grown for 10 years, accounting for survival rates.',
    },
    globalPerCapita: {
        label: 'Global Carbon Project / Our World in Data',
        url: 'https://ourworldindata.org/co2-emissions',
        title: 'CO2 emissions per capita',
        year: 2023,
        summary: 'Global average of roughly 4.7 tonnes of CO2 emitted per person per year, from fossil fuels and industry.',
    },
}

export const COMPARISON_MODES = [
    {
        key: 'car',
        label: 'Car (solo driver)',
        gPerKm: CAR_G_PER_KM,
        isBike: false,
        source: 'Based on the typical gasoline-powered passenger vehicle carrying only the driver.',
        cites: [CITATIONS.epaVehicle],
    },
    {
        key: 'taxi',
        label: 'Taxi or Ride-hail',
        gPerKm: Math.round(CAR_G_PER_KM * 1.3),
        isBike: false,
        source: 'Calculated as a standard car trip plus an extra 30% to account for driving empty between picking up passengers.',
        cites: [CITATIONS.henaoMarshall2019],
    },
    {
        key: 'bus',
        label: 'City Bus',
        gPerKm: 180,
        isBike: false,
        source: 'Based on the average emissions per passenger for a typical urban transit bus.',
        cites: [CITATIONS.ftaClimate2010],
    },
    {
        key: 'subway',
        label: 'Subway or Rail',
        gPerKm: 62,
        isBike: false,
        source: 'Based on the average energy used per passenger on heavy rail transit systems.',
        cites: [CITATIONS.ftaClimate2010],
    },
    {
        key: 'ebike',
        label: 'E-bike',
        gPerKm: 5,
        isBike: true,
        source: 'The tiny amount of electricity needed to charge the battery, calculated using the average cleanliness of the US power grid.',
        cites: [CITATIONS.cherryWeinert2009, CITATIONS.epaEgrid],
    },
    {
        key: 'bike',
        label: 'Classic Bike',
        gPerKm: 0,
        isBike: true,
        source: 'Pure pedal power has zero operational emissions.',
        cites: [],
    },
]

export { CAR_G_PER_KM }

// Bike-share car-substitution shares cluster widely (~2-25%), so avoided-CO2 is shown as a range, never a single number.
export const SUBSTITUTION_RATE = {
    low: 0.05,
    mid: 0.15,
    high: 0.25,
    source: 'Car-substitution shares across bike-share systems range widely, roughly 2–25%.',
    cites: [CITATIONS.fishman2014, CITATIONS.campbellBrakewood2017],
}

export const EXCLUDED_EFFECTS = [
    'Manufacturing, maintaining, and installing bikes and docking stations.',
    'Emissions from the vans used to move bikes between stations to rebalance the fleet.',
    'Route differences (the math assumes 1 kilometer on a bike perfectly replaces 1 kilometer in a car).',
    'Disposing of and recycling bikes and parts at the end of their life.',
    'The wider drop in traffic and congestion when a bike replaces a car.',
]

// Conversion factors for the "what that CO2 equals" cards, each surfaced in the assumptions box with its source.
export const EQUIVALENCE_FACTORS = {
    trees: {
        tonnesPerTreePerYear: 0.006,
        source: 'Assumes a mix of urban tree species, counting one year of their average uptake over a 10-year growth period.',
        cites: [CITATIONS.epaTreeEquivalency],
    },
    globalPerCapita: {
        tonnesPerPerson: 4.7,
        source: "Compared against the global average person's annual CO2 emissions.",
        cites: [CITATIONS.globalPerCapita],
    },
    ledBulb: {
        kgCo2PerKwh: 0.37,
        watts: 9,
        source: 'Assumes the US average grid carbon intensity and a standard 9-watt LED bulb (60-watt incandescent equivalent), counted as one bulb running for a full year.',
        cites: [CITATIONS.epaEgrid],
    },
}
