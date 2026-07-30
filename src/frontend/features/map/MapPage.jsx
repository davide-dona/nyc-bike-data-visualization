import { useLayoutEffect } from 'react'
import DeckGL from '@deck.gl/react'
import { useMapHandler } from './hooks/useMapHandler.js'
import { useBuildLayers } from './hooks/useBuildLayers.js'
import useMapFullscreen from './hooks/useMapFullscreen.js'
import useMapCursor from './hooks/useMapCursor.js'
import useMapClickActions from './hooks/useMapClickActions.js'
import useMapPageStatus from './hooks/useMapPageStatus.js'
import { useTripFlowCamera } from './trip_flow/hooks/useTripFlowCamera.js'
import { useInfrastructureCamera } from './infrastructure/hooks/useInfrastructureCamera.js'
import MapController from './components/MapController.jsx'
import MapLegend from './components/MapLegend.jsx'
import LayerSelector from './components/LayerSelector.jsx'
import InfrastructureStationSidebar from './infrastructure/components/InfrastructureStationSidebar.jsx'
import StatusMessage from '../../components/StatusMessage.jsx'
import mapTooltip from './utils/mapTooltip.js'
import { MAP_TEXT } from './utils/mapText.js'
import VisualizationGuide from '../../components/VisualizationGuide.jsx'
import MapInsightsPanel from './components/MapInsightsPanel.jsx'

/**
 * Page for the interactive map: composes the layer selector, the DeckGL map
 * with its controls, legend, and station sidebar, plus the layer-aware
 * insights panel and reading guide. All state lives in the map handler
 * hooks; this page only wires their results into components.
 * @param {Object} filters - The filters to apply to the data.
 * @param {Function} [onLoadingChange] - Notified with the active layer's loading state so the header can lock the date filter only while the shown layer fetches.
 * @returns The rendered MapPage.
 */
function MapPage({ filters, onLoadingChange }) {
    const { isFullscreen, mapShellRef, toggleFullscreen } = useMapFullscreen()
    const { handleHover, getCursor } = useMapCursor()

    const {
        activeLayer,
        controller,
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
    } = useMapHandler()
    const {
        layers,
        loading,
        error,
        hasData,
        clearInfrastructureSelection,
        refetch,
        clearTripFlowFocus,
        hasTripFlowFocus,
        focusedStationId,
        selectedInfrastructureStations,
        selectInfrastructureStation,
        bikeRoutes,
        insights,
        tripFlowHover,
        tripFlowPin,
        clearCorridorPin,
        tripDirection,
        setTripDirection,
        tripLoading,
        trips,
    } = useBuildLayers({ filters, currentTime, activeLayer, showBikeRoutes, usageMode, hiddenHealthCategories, hiddenRouteClasses, selectedYear })

    // Frame the focused station's corridors; return to the citywide view on reset.
    useTripFlowCamera({ activeLayer, focusedStationId, trips, tripLoading, flyTo, mapShellRef })
    // Fly to the selected infrastructure station; fly back out when cleared.
    useInfrastructureCamera({ activeLayer, selectedStations: selectedInfrastructureStations, flyTo })
    const {
        yearBounds,
        shouldShowMapUi,
        shouldShowMapLegend,
        isAwaitingData,
        shouldShowStatusOverlay,
        guide,
    } = useMapPageStatus({ activeLayer, loading, error, hasData, bikeRoutes })

    // Surface the active layer's loading to the header so it locks the filters
    // only while the layer on screen fetches; reset on unmount. Layout effect
    // (not useEffect) so the header's lock commits in the same paint as the
    // map's loading state instead of a frame later.
    useLayoutEffect(() => {
        onLoadingChange?.(loading)
        return () => onLoadingChange?.(false)
    }, [loading, onLoadingChange])

    const handleMapClick = useMapClickActions({
        activeLayer,
        clearTripFlowFocus,
        hasCorridorPin: Boolean(tripFlowPin.pinnedCorridorKey),
        clearCorridorPin,
        clearInfrastructureSelection,
    })

    return (
        <section className="page-card">
            <header className="page-card__header">
                <div className="page-card__heading">
                    <span className="page-card__eyebrow">{MAP_TEXT.page.eyebrow}</span>
                    <h2 className="page-card__title">{MAP_TEXT.page.title}</h2>
                    <p className="page-card__subtitle">
                        {MAP_TEXT.page.subtitle}
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
                        getTooltip={({ object }) => mapTooltip({ object, activeLayer, usageMode })}
                    />
                    <button
                        type="button"
                        className="map-fullscreen-button"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? MAP_TEXT.fullscreen.exitTitle : MAP_TEXT.fullscreen.enterTitle}
                        aria-label={isFullscreen ? 'Exit full screen map' : 'Enter full screen map'}
                    >
                        <span className="map-fullscreen-button__icon" aria-hidden="true">
                            <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} />
                        </span>
                        <span className="map-fullscreen-button__text">
                            {isFullscreen ? MAP_TEXT.fullscreen.exit : MAP_TEXT.fullscreen.enter}
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
                            tripDirection={tripDirection}
                            setTripDirection={setTripDirection}
                            clearTripFlowFocus={clearTripFlowFocus}
                            hasTripFlowFocus={hasTripFlowFocus}
                            hasCorridorPin={Boolean(tripFlowPin.pinnedCorridorKey)}
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
                            hasTripFlowFocus={hasTripFlowFocus}
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
                        selectStation={selectInfrastructureStation}
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
                    tripFlowHover={tripFlowHover}
                    tripFlowPin={tripFlowPin}
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
