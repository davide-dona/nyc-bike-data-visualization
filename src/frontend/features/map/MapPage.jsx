import DeckGL from '@deck.gl/react'
import { useMemo } from 'react'
import { useMapHandler } from './hooks/useMapHandler.js'
import { useBuildLayers } from './hooks/useBuildLayers.js'
import useMapFullscreen from './hooks/useMapFullscreen.js'
import useMapCursor from './hooks/useMapCursor.js'
import useMapClickActions from './hooks/useMapClickActions.js'
import { getRouteYearBounds } from './utils/routeYearFilter.js'
import MapController from './components/MapController.jsx'
import MapLegend from './components/MapLegend.jsx'
import LayerSelector from './components/LayerSelector.jsx'
import InfrastructureStationSidebar from './components/InfrastructureStationSidebar.jsx'
import StatusMessage from '../../components/StatusMessage.jsx'
import Tooltip from './components/Tooltip.jsx'
import VisualizationGuide from '../../components/VisualizationGuide.jsx'
import MapInsightsPanel from './components/MapInsightsPanel.jsx'
import { MAP_LAYER_GUIDES } from './utils/mapGuides.js'

/**
 * Page for the interactive map: composes the layer selector, the DeckGL map
 * with its controls, legend, and station sidebar, plus the layer-aware
 * insights panel and reading guide. All state lives in the map handler
 * hooks; this page only wires their results into components.
 * @param {Object} filters - The filters to apply to the data.
 * @returns The rendered MapPage.
 */
function MapPage({ filters }) {
    const { isFullscreen, mapShellRef, toggleFullscreen } = useMapFullscreen()
    const { handleHover, getCursor } = useMapCursor()

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

    const handleMapClick = useMapClickActions({ activeLayer, clearTripFlowFocus, clearInfrastructureSelection })

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
