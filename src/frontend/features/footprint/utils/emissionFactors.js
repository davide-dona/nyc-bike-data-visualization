// Operational emission factors in g CO2e per passenger-km. Kept as frontend
// constants (backend only reports distances) and surfaced verbatim in the
// assumptions box, so keep label/source strings user-readable.

// US EPA: 404 g CO2/mile ≈ 251 g/km for a solo-driven car trip.
const CAR_G_PER_KM = 251

export const COMPARISON_MODES = [
    {
        key: 'car',
        label: 'Car (solo driver)',
        gPerKm: CAR_G_PER_KM,
        isBike: false,
        source: 'Based on the typical gasoline-powered passenger vehicle carrying only the driver (US EPA).',
    },
    {
        key: 'taxi',
        label: 'Taxi or Ride-hail',
        gPerKm: Math.round(CAR_G_PER_KM * 1.3),
        isBike: false,
        source: 'Calculated as a standard car trip plus an extra 30% to account for driving empty between picking up passengers (Henao & Marshall, 2019).',
    },
    {
        key: 'bus',
        label: 'City Bus',
        gPerKm: 180,
        isBike: false,
        source: 'Based on the average emissions per passenger for a typical urban transit bus (Federal Transit Administration).',
    },
    {
        key: 'subway',
        label: 'Subway or Rail',
        gPerKm: 62,
        isBike: false,
        source: 'Based on the average energy used per passenger on heavy rail transit systems (Federal Transit Administration).',
    },
    {
        key: 'ebike',
        label: 'E-bike',
        gPerKm: 5,
        isBike: true,
        source: 'The tiny amount of electricity needed to charge the battery, calculated using the average cleanliness of the US power grid (EPA eGRID).',
    },
    {
        key: 'bike',
        label: 'Classic Bike',
        gPerKm: 0,
        isBike: true,
        source: 'Pure pedal power has zero operational emissions.',
    },
]

export { CAR_G_PER_KM }

// Bike-share car-substitution shares cluster widely (~2-25%; see source
// below), so avoided-CO2 is always shown as a range, never a single number.
export const SUBSTITUTION_RATE = {
    low: 0.05,
    mid: 0.15,
    high: 0.25,
    source: 'Car-substitution shares across bike-share systems, ~2–25% (Fishman et al., 2014; Campbell & Brakewood, 2017)',
}

export const EXCLUDED_EFFECTS = [
    'Manufacturing, maintaining, and installing bikes and docking stations.',
    'Emissions from the vans used to move bikes between stations to rebalance the fleet.',
    'Route differences (the math assumes 1 kilometer on a bike perfectly replaces 1 kilometer in a car).',
    'E-bike charging emissions (around 5g of CO2 per km), which would lower the total savings by less than 2%.',
]
