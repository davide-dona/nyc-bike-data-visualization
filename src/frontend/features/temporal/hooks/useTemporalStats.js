import { useMemo } from "react";
import useDayHourStats from "./useDayHourStats";
import useDateStats from "./useDateStats";
import { marginalizeDayHour } from "../utils/marginalizeStats.js";

/**
 * Composes the page's two stats fetches (day-hour grid and per-date series)
 * and derives the day/hour marginals plus per-chart query states.
 * @param {Object} filters - The filters to apply to the data.
 * @returns {Object} dayHourStats, dayStats, hourStats, dateStats, aggregate
 * loading/error/refetch, and a queries map with per-breakdown query states.
 */
export default function useTemporalStats(filters) {
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
