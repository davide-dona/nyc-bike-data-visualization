import { useCallback, useState } from 'react'
import { POINT_LAYER_ID_PREFIXES } from '../utils/mapConfig.js'

/**
 * Handler hook for the map cursor: tracks whether a clickable point feature
 * is hovered and derives the grab/grabbing/pointer cursor for DeckGL.
 * @returns {Object} The deck.gl onHover handler and the getCursor callback.
 */
export default function useMapCursor() {
    const [isHoveringPoint, setIsHoveringPoint] = useState(false)

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

    return { handleHover, getCursor }
}
