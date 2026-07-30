export const MAX_COVERED_MONTHS = 12
// Labels for visualization
export const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => String(i))
export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
// Limit the number of stations to fetch for performance reasons
export const LIMIT_STATIONS = 3000
export const LIMIT_TRIPS_OVERVIEW = 1000 // Citywide corridors drawn on the overview
// Ranked corridor rows listed (and emphasized on the map) in trip flow insights
export const TRIP_FLOW_LIST_SIZE = 12
