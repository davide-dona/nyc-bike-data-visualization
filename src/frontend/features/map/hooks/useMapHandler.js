import { useCallback, useEffect, useState } from 'react'
import { FlyToInterpolator } from '@deck.gl/core'
import { LAYER_OPTIONS, MIN_PITCH, MAX_PITCH, MIN_ZOOM, MAX_ZOOM, INITIAL_VIEW_STATE, MIN_LONGITUDE, MAX_LONGITUDE, MIN_LATITUDE, MAX_LATITUDE } from '../utils/mapConfig.js'

import { clamp } from '@/utils/math.js'

// Duration of programmatic camera moves (ms).
const FLY_TO_DURATION = 900

/**
 * Handler hook for map view state, camera moves, and per-layer UI toggles.
 * @returns {Object} The map handler functions and state.
 */
export function useMapHandler() {
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
    // Current hour frame (0-23) for animation. Default to 7 AM
    const [currentTime, setCurrentTime] = useState(7)
    const [hasAnimation, setHasAnimation] = useState(true)
    const [activeLayer, setActiveLayer] = useState('station_usage')
    const [showBikeRoutes, setShowBikeRoutes] = useState(false)
    // Which metric the station usage layer encodes ('all' | 'incoming' | 'outgoing')
    const [usageMode, setUsageMode] = useState('all')
    // View preferences that persist across layer switches.
    const [hiddenHealthCategories, setHiddenHealthCategories] = useState(() => new Set())
    const [hiddenRouteClasses, setHiddenRouteClasses] = useState(() => new Set())
    // Historical year for the bike-route network; null means "present"
    const [selectedYear, setSelectedYear] = useState(null)

    const toggleHealthCategory = useCallback((key) => {
        setHiddenHealthCategories((prev) => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })
    }, [])

    const toggleRouteClass = useCallback((key) => {
        setHiddenRouteClasses((prev) => {
            const next = new Set(prev)
            next.has(key) ? next.delete(key) : next.add(key)
            return next
        })
    }, [])

    // Animated camera move; target values pass through the same clamps as manual view changes.
    const flyTo = useCallback(({ longitude, latitude, zoom }) => {
        setViewState((prev) => ({
            ...prev,
            longitude: clamp(longitude, MIN_LONGITUDE, MAX_LONGITUDE),
            latitude: clamp(latitude, MIN_LATITUDE, MAX_LATITUDE),
            zoom: clamp(zoom, MIN_ZOOM, MAX_ZOOM),
            transitionDuration: FLY_TO_DURATION,
            transitionInterpolator: new FlyToInterpolator(),
        }))
    }, [])

    const handleViewStateChange = useCallback(({ viewState: nextViewState }) => {
        setViewState({
            ...nextViewState,
            longitude: clamp(nextViewState.longitude, MIN_LONGITUDE, MAX_LONGITUDE),
            latitude: clamp(nextViewState.latitude, MIN_LATITUDE, MAX_LATITUDE),
            zoom: clamp(nextViewState.zoom, MIN_ZOOM, MAX_ZOOM),
            pitch: clamp(nextViewState.pitch, MIN_PITCH, MAX_PITCH),
        })
    }, [])

    useEffect(() => {
        setHasAnimation(LAYER_OPTIONS.find((layer) => layer.value === activeLayer)?.hasAnimation ?? false)
    }, [activeLayer])

    return {
        activeLayer,
        controller: {
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            minPitch: MIN_PITCH,
            maxPitch: MAX_PITCH,
            dragRotate: true,
            touchRotate: true,
        },
        currentTime,
        flyTo,
        handleViewStateChange,
        hasAnimation,
        hiddenHealthCategories,
        hiddenRouteClasses,
        selectedYear,
        setActiveLayer,
        setCurrentTime,
        setSelectedYear,
        setShowBikeRoutes,
        setUsageMode,
        showBikeRoutes,
        toggleHealthCategory,
        toggleRouteClass,
        usageMode,
        viewState,
    }
}