import { useMemo, useRef, useState } from 'react'
import { buildLayerKey } from '../utils/compareLayers.js'

/**
 * Handler hook owning the TemporalPage local state: the active metric, the
 * hovered surface coordinates, the plot overlay ref, and the derived filter
 * keys that drive the compare state machine and the pinned slice.
 * @param {Object} filters - The page filters.
 * @returns {Object} activeMetric/setActiveMetric, coordinates/setCoordinates, overlayRef, filtersKey, baseClassFilters, and baseLayerKey.
 */
export default function useTemporalPageState(filters) {
    const [activeMetric, setActiveMetric] = useState('total_rides')
    const [coordinates, setCoordinates] = useState(null)
    const overlayRef = useRef(null)

    // Drives reset-on-filter-change for both the compare state machine and the pinned slice.
    const filtersKey = useMemo(() => JSON.stringify(filters ?? {}), [filters])
    const baseClassFilters = useMemo(
        () => ({
            user_type: filters?.user_type,
            bike_type: filters?.bike_type,
        }),
        [filters],
    )
    const baseLayerKey = useMemo(
        () => buildLayerKey(baseClassFilters),
        [baseClassFilters],
    )

    return {
        activeMetric,
        setActiveMetric,
        coordinates,
        setCoordinates,
        overlayRef,
        filtersKey,
        baseClassFilters,
        baseLayerKey,
    }
}
