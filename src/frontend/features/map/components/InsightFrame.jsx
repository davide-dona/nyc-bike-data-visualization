import StatusMessage from '@/components/StatusMessage.jsx'

/**
 * One chart frame: a panel-frame with a title, the plot area, an optional
 * mono caption, and its own StatusMessage overlay so a failed query dims
 * this frame only - never the map above it.
 * @param {string} title - Frame title shown above the plot.
 * @param {string|null} note - Optional mono caption below the plot.
 * @param {{loading: boolean, error: any, refetch: Function}} status - Query status driving the overlay.
 * @param {string|null} emptyMessage - Message shown instead of the plot when there is no data.
 * @param {boolean} tall - Whether the plot area uses the tall variant.
 * @param {import('react').ReactNode} children - The chart to render inside the frame.
 * @returns The rendered insight frame.
 */
export default function InsightFrame({ title, note, status, emptyMessage, tall = false, children }) {
    const showStatus = Boolean(status?.loading || status?.error)
    const showEmpty = Boolean(emptyMessage) && !showStatus

    return (
        <div className="panel-frame">
            <p className="panel-frame__title">{title}</p>
            <div className={`map-insights__plot${tall ? ' map-insights__plot--tall' : ''}`}>
                {showEmpty
                    ? <div className="map-insights__empty">{emptyMessage}</div>
                    : children}
                {showStatus && (
                    <StatusMessage loading={status.loading} error={status.error} onRefetch={status.refetch} />
                )}
            </div>
            {note && <p className="map-insights__note">{note}</p>}
        </div>
    )
}
