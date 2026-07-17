import StatusMessage from '@/components/StatusMessage.jsx'

/** Shared chart frame: panel with a title, plot area, optional reading note, and its own StatusMessage overlay so a failed query only dims this frame. */
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
