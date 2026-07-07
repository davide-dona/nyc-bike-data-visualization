import { useMemo, useState } from "react";
import useDayHourStats from "./useDayHourStats";
import useDateStats from "./useDateStats";
import { marginalizeDayHour } from "../utils/marginalizeStats.js";

/**
 * Hook to manage the temporal state for the  page.
 * @param {*} filters - The filters to apply to the data.
 * @returns The state and functions for managing the temporal data.
 */
export default function useTemporalState(filters) {
    // State to track the currently active metric for the surface graph, initialized to 'total_rides'
    const [activeMetric, setActiveMetric] = useState('total_rides')
    // State to track the coordinates of the currently hovered point on the surface graph
    const [coordinates, setCoordinates] = useState(null)

    // Fetches the day-hour statistics based on the provided filters using a custom hook. The hook returns the data, loading state, and any error encountered during the fetch.
    const {
        dayHourStats,
        loading: loadingDayHourStats,
        error: errorDayHourStats,
        refetch: refetchDayHourStats,
    } = useDayHourStats(filters)
    const {
        dateStats,
        loading: loadingDateStats,
        error: errorDateStats,
        refetch: refetchDateStats,
    } = useDateStats(filters)

    // Day and hour histograms read marginals of the day-hour grid, so they
    // share the surface's fetch instead of issuing their own.
    const dayStats = useMemo(() => marginalizeDayHour(dayHourStats, 'day_of_week'), [dayHourStats])
    const hourStats = useMemo(() => marginalizeDayHour(dayHourStats, 'hour'), [dayHourStats])

    // Aggregate states, for page-level concerns (controls gating, compare layers)
    const loading = loadingDayHourStats || loadingDateStats
    const error = errorDayHourStats || errorDateStats
    const refetch = () => Promise.all([
        refetchDayHourStats(),
        refetchDateStats(),
    ])

    // Per-breakdown states, so each chart reflects only its own queries.
    // The day and hour marginals derive from the day-hour query, so they
    // share its state.
    const dayHourQueryState = { loading: loadingDayHourStats, error: errorDayHourStats, refetch: refetchDayHourStats }
    const queries = {
        dayHour: dayHourQueryState,
        day: dayHourQueryState,
        hour: dayHourQueryState,
        date: { loading: loadingDateStats, error: errorDateStats, refetch: refetchDateStats },
    }

    return {
        activeMetric,
        setActiveMetric,
        coordinates,
        setCoordinates,
        dayHourStats,
        dayStats,
        hourStats,
        dateStats,
        loading,
        error,
        refetch,
        queries,
    }
}
