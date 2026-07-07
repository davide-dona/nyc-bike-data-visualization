import DeckGL from '@deck.gl/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMapHandler } from './hooks/useMapHandler.js'
import { useBuildLayers } from './hooks/useBuildLayers.js'
import { getRouteYearBounds } from './utils/routeYearFilter.js'
import MapController from './components/MapController.jsx'
import MapLegend from './components/MapLegend.jsx'
import LayerSelector from './components/LayerSelector.jsx'
import InfrastructureStationSidebar from './components/InfrastructureStationSidebar.jsx'
import StatusMessage from '../../components/StatusMessage.jsx'
import Tooltip from './components/Tooltip.jsx'
import VisualizationGuide from '../../components/VisualizationGuide.jsx'
import MapInsightsPanel from './components/MapInsightsPanel.jsx'
import { POINT_LAYER_ID_PREFIXES } from './utils/mapConfig.js'
import { MAP_LAYER_GUIDES } from './utils/mapGuides.js'

function MapPage({ filters }) {
    const [isHoveringPoint, setIsHoveringPoint] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const mapShellRef = useRef(null)

    const handleHover = useCallback(({ object, layer }) => {
        if (!object || !layer?.id) {
            setIsHoveringPoint(false)
            return
        }

        setIsHoveringPoint(
            POINT_LAYER_ID_PREFIXES.some((prefix) => layer.id.startsWith(prefix)),
        )
    }, [])

    const getCursor = useCallback(({ isDragging }) => {
        if (isDragging) return 'grabbing'
        if (isHoveringPoint) return 'pointer'
        return 'grab'
    }, [isHoveringPoint])

    useEffect(() => {
        const syncFullscreenState = () => {
            setIsFullscreen(document.fullscreenElement === mapShellRef.current)
        }

        document.addEventListener('fullscreenchange', syncFullscreenState)
        return () => {
            document.removeEventListener('fullscreenchange', syncFullscreenState)
        }
    }, [])

    const toggleFullscreen = useCallback(async () => {
        const mapShellNode = mapShellRef.current
        if (!mapShellNode || !document.fullscreenEnabled) return

        if (document.fullscreenElement === mapShellNode) {
            await document.exitFullscreen()
            return
        }

        await mapShellNode.requestFullscreen()
    }, [])

    // Map handler manages view state, active layer, animation time, and related logic
    const {
        activeLayer,
        controller,
        currentTime,
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
    } = useMapHandler()
    // Build the layers to be rendered based on the active layer and fetched data
    const {
        layers,
        loading,
        error,
        hasData,
        clearInfrastructureSelection,
        refetch,
        clearTripFlowFocus,
        hasTripFlowFocus,
        selectedInfrastructureStations,
        bikeRoutes,
        insights,
    } = useBuildLayers({ filters, currentTime, activeLayer, showBikeRoutes, usageMode, hiddenHealthCategories, hiddenRouteClasses, selectedYear })
    const yearBounds = useMemo(() => getRouteYearBounds(bikeRoutes), [bikeRoutes])
    const shouldShowMapUi = !error
    const shouldShowMapLegend = !loading && !error
    // Data can also be "not ready yet" without a query in flight (e.g. before
    // the date range seeds the filters), so missing data reads as loading
    const isAwaitingData = !error && !hasData
    const shouldShowStatusOverlay = loading || error || isAwaitingData
    const guide = MAP_LAYER_GUIDES[activeLayer] ?? MAP_LAYER_GUIDES.station_usage

    const handleMapClick = useCallback((info) => {
        const pickedObject = info?.object

        // Clicking empty map exits the trip-flow focus back to the overview;
        // station and arc picks carry an object, so they never clear it here.
        if (activeLayer === 'trip_flow') {
            if (!pickedObject) clearTripFlowFocus()
            return
        }

        if (activeLayer !== 'infrastructure') return

        const layerId = info?.layer?.id ?? ''
        const isStationPick = layerId.startsWith('station-availability-layer') && pickedObject?.id

        if (isStationPick) return

        if (!pickedObject) {
            clearInfrastructureSelection()
        }
    }, [activeLayer, clearInfrastructureSelection, clearTripFlowFocus])

    return (
        <section className="page-card">
            <header className="page-card__header">
                <div className="page-card__heading">
                    <span className="page-card__eyebrow">01 - Atlas</span>
                    <h2 className="page-card__title">The city, one ride at a time.</h2>
                    <p className="page-card__subtitle">
                        An interactive read of station usage, trip flows, and cycling
                        infrastructure across the five boroughs.
                    </p>
                </div>
                <div className="page-card__actions">
                    <LayerSelector
                        activeLayer={activeLayer}
                        setActiveLayer={setActiveLayer}
                        disabled={loading}
                    />
                </div>
            </header>
            <div className="page-card__body">
                <div ref={mapShellRef} className="map-shell">
                    <DeckGL
                        viewState={viewState}
                        onViewStateChange={handleViewStateChange}
                        controller={controller}
                        layers={layers}
                        onHover={handleHover}
                        onClick={handleMapClick}
                        getCursor={getCursor}
                        getTooltip={({ object }) => Tooltip({ object, activeLayer, usageMode })}
                    />
                    <button
                        type="button"
                        className="map-fullscreen-button"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
                        aria-label={isFullscreen ? 'Exit full screen map' : 'Enter full screen map'}
                    >
                        <span className="map-fullscreen-button__icon" aria-hidden="true">
                            <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
                        </span>
                        <span className="map-fullscreen-button__text">
                            {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                        </span>
                    </button>
                    {shouldShowMapUi && (
                        <MapController
                            activeLayer={activeLayer}
                            currentTime={currentTime}
                            setCurrentTime={setCurrentTime}
                            hasAnimation={hasAnimation}
                            showBikeRoutes={showBikeRoutes}
                            setShowBikeRoutes={setShowBikeRoutes}
                            usageMode={usageMode}
                            setUsageMode={setUsageMode}
                            clearTripFlowFocus={clearTripFlowFocus}
                            hasTripFlowFocus={hasTripFlowFocus}
                            selectedYear={selectedYear}
                            setSelectedYear={setSelectedYear}
                            yearBounds={yearBounds}
                            disabled={loading}
                        />
                    )}
                    {shouldShowMapLegend && (
                        <MapLegend
                            activeLayer={activeLayer}
                            showBikeRoutes={showBikeRoutes}
                            hiddenHealthCategories={hiddenHealthCategories}
                            hiddenRouteClasses={hiddenRouteClasses}
                            onToggleHealthCategory={toggleHealthCategory}
                            onToggleRouteClass={toggleRouteClass}
                        />
                    )}
                    <InfrastructureStationSidebar
                        selectedStations={selectedInfrastructureStations}
                        filters={filters}
                        onClose={clearInfrastructureSelection}
                    />
                    {shouldShowStatusOverlay && (
                        <StatusMessage
                            loading={loading || isAwaitingData}
                            error={error}
                            onRefetch={refetch}
                        />
                    )}
                </div>

                <MapInsightsPanel
                    activeLayer={activeLayer}
                    insights={insights}
                    usageMode={usageMode}
                    currentTime={currentTime}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                    yearBounds={yearBounds}
                />

                <VisualizationGuide
                    mapName={guide.mapName}
                    title={guide.title}
                    summary={guide.summary}
                    hints={guide.hints}
                />
            </div>
        </section>
    )
}

export default MapPage
