import { useEffect, useRef } from "react";
import { MAX_COVERED_MONTHS } from '@/utils/config.js'
import { defaultWindowStart } from '../utils/dateFormatter.js'

/**
 * Handler hook that seeds the date-range filter once: as soon as the dataset
 * bounds arrive and no range is set yet, the last covered months are committed.
 * @param {Object|null} datasetRange - Dataset bounds ({min_date, max_date}) from the fetch hook.
 * @param {Object|null} dateRange - The currently committed range, if any.
 * @param {Function} onCommit - Commits a {start_date, end_date} range.
 * @returns {void}
 */
export default function useDateRangeSeed({ datasetRange, dateRange, onCommit }) {
    const hasSeededDateRangeRef = useRef(false);

    const buildSeedRange = () => {
        if (!datasetRange?.min_date || !datasetRange?.max_date) return null

        const maxDate = new Date(datasetRange.max_date)
        const minDate = new Date(datasetRange.min_date)
        const startDate = defaultWindowStart(minDate, maxDate, MAX_COVERED_MONTHS)

        return {
            start_date: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`,
            end_date: datasetRange.max_date,
        }
    }

    useEffect(() => {
        if (hasSeededDateRangeRef.current) return;
        if (!datasetRange?.min_date || !datasetRange?.max_date) return;
        if (dateRange) return;

        const nextDateRange = buildSeedRange()
        if (!nextDateRange) return

        hasSeededDateRangeRef.current = true;
        onCommit(nextDateRange);
    }, [datasetRange, dateRange, onCommit]);
}
