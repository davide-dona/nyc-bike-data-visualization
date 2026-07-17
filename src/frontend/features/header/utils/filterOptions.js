// Rider/bike filter catalog shared by the header filter control and the temporal compare panel.
export const FILTERS = {
    user_type: { label: 'User Type', options: ['member', 'casual'] },
    bike_type: { label: 'Bike Type', options: ['classic_bike', 'electric_bike'] },
}

export const FILTER_HINTS = {
    user_type: 'Categories: Member (subscribed riders) and Casual (single-ride or pass users). Use All to include both groups.',
    bike_type: 'Categories: Classic Bike and Electric Bike. Use All to compare the combined behavior of both bike types.',
}

const FILTER_OPTION_ICONS = {
    all: 'fa-solid fa-globe',
    member: 'fa-solid fa-id-card',
    casual: 'fa-solid fa-user',
    classic_bike: 'fa-solid fa-bicycle',
    electric_bike: 'fa-solid fa-bolt',
}

/**
 * Turns a snake_case option value into a title-case label.
 * @param {string} value - Option value (e.g. "classic_bike").
 * @returns {string} The display label (e.g. "Classic Bike").
 */
export const formatFilterLabel = (value) =>
    value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

/**
 * Resolves the Font Awesome icon for a filter option.
 * @param {string} option - Filter option value.
 * @returns {string} Icon class, with the globe fallback.
 */
export const getFilterIcon = (option) => FILTER_OPTION_ICONS[option] ?? FILTER_OPTION_ICONS.all
