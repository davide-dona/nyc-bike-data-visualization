import StatusMessage from '@/components/StatusMessage.jsx'

/**
 * Shared chart frame: a panel with a title, the plot area, an optional brief
 * reading note, and its own StatusMessage overlay so a failed query dims this
 * frame only - never the content around it.
 * @param {string} title - Frame title shown above the plot.
 * @param {string|null} note - Optional brief note below the plot explaining how to read it.
 * @param {{loading: boolean, error: any, refetch: Function}} status - Query status driving the overlay.
 * @param {string|null} emptyMessage - Message shown instead of the plot when there is no data.
 * @param {boolean} tall - Whether the plot area uses the tall variant.
 * @param {boolean} autoHeight - Whether the plot area grows with its HTML content instead of using a fixed chart height.
 * @param {string} [frameClassName='panel-frame'] - Class of the outer frame, for feature-specific frame looks.
 * @param {string} [titleClassName='panel-frame__title'] - Class of the title element.
 * @param {string} [plotClassName] - Extra class on the plot area, for feature-specific sizing.
 * @param {import('react').ReactNode} children - The chart to render inside the frame.
 * @returns The rendered chart frame.
 */
export default function ChartFrame({
    title,
    note,
    status,
    emptyMessage,
    tall = false,
    autoHeight = false,
    frameClassName = 'panel-frame',
    titleClassName = 'panel-frame__title',
    plotClassName = '',
    children,
}) {
    const showStatus = Boolean(status?.loading || status?.error)
    const showEmpty = Boolean(emptyMessage) && !showStatus
    const plotVariant = autoHeight
        ? ' chart-frame__plot--auto'
        : (tall ? ' chart-frame__plot--tall' : '')

    return (
        <div className={frameClassName}>
            <p className={titleClassName}>{title}</p>
            <div className={`chart-frame__plot${plotVariant}${plotClassName ? ` ${plotClassName}` : ''}`}>
                {showEmpty
                    ? <div className="chart-frame__empty">{emptyMessage}</div>
                    : children}
                {showStatus && (
                    <StatusMessage loading={status.loading} error={status.error} onRefetch={status.refetch} />
                )}
            </div>
            {note && <p className="chart-frame__note">{note}</p>}
        </div>
    )
}
