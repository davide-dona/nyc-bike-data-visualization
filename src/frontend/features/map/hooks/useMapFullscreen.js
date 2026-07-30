import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Handler hook for the map shell's fullscreen mode: tracks the browser's
 * fullscreen element and toggles the shell in and out of fullscreen.
 * @returns {Object} isFullscreen, the map shell ref, and toggleFullscreen.
 */
export default function useMapFullscreen() {
    const [isFullscreen, setIsFullscreen] = useState(false)
    const mapShellRef = useRef(null)

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

    return { isFullscreen, mapShellRef, toggleFullscreen }
}
