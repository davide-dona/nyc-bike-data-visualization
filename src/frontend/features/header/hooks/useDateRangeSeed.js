import { useEffect, useRef } from "react";

/**
 * Handler hook that seeds the date-range filter once: as soon as the dataset
 * bounds arrive and no range is set yet, the full dataset range is committed.
 * @param {Object|null} datasetRange - Dataset bounds ({min_date, max_date}) from the fetch hook.
 * @param {Object|null} dateRange - The currently committed range, if any.
 * @param {Function} onCommit - Commits a {start_date, end_date} range.
 * @returns {void}
 */
export default function useDateRangeSeed({ datasetRange, dateRange, onCommit }) {
    const hasSeededDateRangeRef = useRef(false);

    useEffect(() => {
        if (hasSeededDateRangeRef.current) return;
        if (!datasetRange?.min_date || !datasetRange?.max_date) return;
        if (dateRange) return;

        hasSeededDateRangeRef.current = true;
        onCommit({
            start_date: datasetRange.min_date,
            end_date: datasetRange.max_date,
        });
    }, [datasetRange, dateRange, onCommit]);
}
