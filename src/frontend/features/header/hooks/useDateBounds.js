import { useMemo } from 'react'
import { useDatasetDateRange } from './useDatasetDateRange.js'
import { normalizeBounds } from '../utils/dateFormatter.js'

/**
 * Provides the normalized dataset bounds for the date window picker.
 * @returns {Object} The normalized bounds ({minDate, maxDate, totalMonths}) and the loading state of the dataset date range fetch.
 */
export default function useDateBounds() {
    const { dateRange, loading } = useDatasetDateRange()
    const bounds = useMemo(
        () => normalizeBounds(dateRange),
        [dateRange?.max_date, dateRange?.min_date],
    )

    return { bounds, loading }
}
