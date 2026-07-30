import { useState } from 'react'

/**
 * Manages header filters (date range + rider/bike filters) for the app.
 * @param {function} onFiltersChange - Called with the combined filters on any change.
 * @returns Current date range, user filters, and their commit/change handlers.
 */
export default function useHeaderFilters(onFiltersChange) {
    const [dateRange, setDateRange] = useState(null)
    const [currentUserFilters, setCurrentUserFilters] = useState({})
    const handleDateRangeCommit = (nextDateRange) => {
        setDateRange(nextDateRange)
        onFiltersChange?.({ ...currentUserFilters, ...nextDateRange })
    }
    const handleUserFilterChange = (nextUserFilters) => {
        setCurrentUserFilters(nextUserFilters)
        onFiltersChange?.({ ...dateRange, ...nextUserFilters })
    }

    return {
        dateRange,
        currentUserFilters,
        handleDateRangeCommit,
        handleUserFilterChange,
    }
}