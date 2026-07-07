import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Handler hook for the infrastructure station multi-select: toggles stations
 * on click (shift-click extends the selection), keeps selections valid as
 * station data refreshes, and exposes the selected station objects.
 * @param {Array} stations - Current stations with live availability data.
 * @returns {Object} Selection ids/objects, the pick handler, and the clear action.
 */
export function useInfrastructureStationSelection(stations = []) {
    const [selectedStationIdSet, setSelectedStationIdSet] = useState(() => new Set())

    const clearSelectedStations = useCallback(() => {
        setSelectedStationIdSet(new Set())
    }, [])

    const onStationPick = useCallback((info, event) => {
        const stationId = info?.object?.id
        if (!stationId) return

        const srcEvent = event?.srcEvent ?? event
        const isMultiSelect = Boolean(srcEvent?.ctrlKey || srcEvent?.metaKey || srcEvent?.shiftKey)

        setSelectedStationIdSet((previousSet) => {
            const previousIds = Array.from(previousSet)

            if (!isMultiSelect) {
                if (previousIds.length === 1 && previousSet.has(stationId)) {
                    return new Set()
                }
                return new Set([stationId])
            }

            if (previousSet.has(stationId)) {
                return new Set(previousIds.filter((selectedId) => selectedId !== stationId))
            }

            return new Set(previousSet).add(stationId)
        })
    }, [])

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
        selectedStationIds,
        selectedStations,
    }
}

export default useInfrastructureStationSelection