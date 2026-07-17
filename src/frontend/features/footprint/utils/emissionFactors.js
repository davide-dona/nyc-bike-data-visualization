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
        source: 'US EPA, average gasoline passenger vehicle: 404 g CO2/mile ≈ 251 g/km, single occupant',
    },
    {
        key: 'taxi',
        label: 'Taxi / ride-hail',
        gPerKm: Math.round(CAR_G_PER_KM * 1.3),
        isBike: false,
        source: 'Car factor + ~30% empty repositioning between fares (Henao & Marshall, 2019)',
    },
    {
        key: 'bus',
        label: 'Bus',
        gPerKm: 180,
        isBike: false,
        source: 'FTA (2010), US urban bus at average occupancy: 0.64 lb CO2/passenger-mile ≈ 180 g/km',
    },
    {
        key: 'subway',
        label: 'Subway',
        gPerKm: 62,
        isBike: false,
        source: 'FTA (2010), US heavy rail average: 0.22 lb CO2/passenger-mile ≈ 62 g/km',
    },
    {
        key: 'ebike',
        label: 'E-bike',
        gPerKm: 5,
        isBike: true,
        source: '~11 Wh/km of charging at the ~390 g CO2/kWh US grid average (EPA eGRID)',
    },
    {
        key: 'bike',
        label: 'Classic bike',
        gPerKm: 0,
        isBike: true,
        source: 'No operational emissions; manufacturing and maintenance are excluded (see below)',
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
    'Bike manufacturing, maintenance, and dock infrastructure',
    'Rebalancing vans moving bikes between stations',
    'Differences in length between the ride and the car trip it replaces (1 ridden km is assumed to replace 1 driven km)',
    'E-bike charging emissions (~5 g/km) are not deducted from the avoided figure; they would lower it by at most ~2%',
]
