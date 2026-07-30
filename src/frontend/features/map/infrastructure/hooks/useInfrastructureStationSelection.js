import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Handler hook for the infrastructure station selection: toggles a single
 * station on click (clicking the selected station again clears it), keeps
 * the selection valid as station data refreshes, clears when leaving the
 * infrastructure layer, and exposes the selected station object.
 * @param {Array} stations - Current stations with live availability data.
 * @param {string} activeLayer - The active map layer key.
 * @returns {Object} Selection ids/objects, the pick/select handlers, and the clear action.
 */
export function useInfrastructureStationSelection(stations = [], activeLayer) {
    const [selectedStationIdSet, setSelectedStationIdSet] = useState(() => new Set())

    // The selection belongs to the infrastructure view only, so switching layers resets it.
    useEffect(() => {
        if (activeLayer === 'infrastructure') return
        setSelectedStationIdSet((previousSet) => previousSet.size ? new Set() : previousSet)
    }, [activeLayer])

    const clearSelectedStations = useCallback(() => {
        setSelectedStationIdSet(new Set())
    }, [])

    const onStationPick = useCallback((info) => {
        const stationId = info?.object?.id
        if (!stationId) return

        setSelectedStationIdSet((previousSet) => (
            previousSet.has(stationId) ? new Set() : new Set([stationId])
        ))
    }, [])

    // Selects a station directly (bypassing deck.gl's pick-info shape) for DOM-driven selection, e.g. leaderboard rows.
    const selectStation = useCallback((stationId) => {
        if (!stations.some((station) => station.id === stationId)) return
        setSelectedStationIdSet(new Set([stationId]))
    }, [stations])

    useEffect(() => {
        setSelectedStationIdSet((previousSet) => {
            if (!previousSet.size) return previousSet
            const validIds = new Set(stations.map((station) => station.id))
            const nextIds = Array.from(previousSet).filter((stationId) => validIds.has(stationId))
            if (nextIds.length === previousSet.size) return previousSet
            return new Set(nextIds)
        })
    }, [stations])

    const selectedStationIds = useMemo(() => Array.from(selectedStationIdSet), [selectedStationIdSet])

    const selectedStations = useMemo(() => {
        const byId = new Map(stations.map((station) => [station.id, station]))
        return selectedStationIds.map((stationId) => byId.get(stationId)).filter(Boolean)
    }, [selectedStationIds, stations])

    return {
        clearSelectedStations,
        onStationPick,
        selectStation,
        selectedStationIds,
        selectedStations,
    }
}

export default useInfrastructureStationSelection