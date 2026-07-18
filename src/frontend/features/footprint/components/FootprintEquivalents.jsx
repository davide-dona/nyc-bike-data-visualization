import ChartFrame from '@/components/ChartFrame.jsx'
import { formatCompact } from '../utils/footprintMath.js'
import useFootprintEquivalents from '../hooks/useFootprintEquivalents.js'
import { FOOTPRINT_TEXT } from '../utils/footprintText.js'

/**
 * Pictogram translating the avoided CO2 into everyday yearly equivalents: each
 * row repeats its icon proportionally to the value, with the precise figure on
 * the right. The "1 icon = N" scale is anchored to the mid substitution rate and
 * the selected date range, so the icon count stays near TARGET_ICONS whatever the
 * range length while the slider still visibly moves it. Every factor is stated in
 * the assumptions box (AssumptionsBox.jsx).
 * @param {Object} totals - Summed daily stats (total_distance_km).
 * @param {number} substitutionRate - Selected car-substitution rate (fraction).
 */
export default function FootprintEquivalents({ totals, substitutionRate, loading, error, onRefetch }) {
    const { rows, hasData } = useFootprintEquivalents({ totals, substitutionRate })

    return (
        <ChartFrame
            title={FOOTPRINT_TEXT.equivalents.title}
            note={FOOTPRINT_TEXT.equivalents.note}
            status={{ loading, error, refetch: onRefetch }}
            emptyMessage={hasData ? null : FOOTPRINT_TEXT.equivalents.emptyMessage}
            autoHeight
        >
            <div className="footprint-pictogram">
                {rows.map((row) => (
                    <div key={row.key} className="footprint-pictogram__row">
                        <div className="footprint-pictogram__body">
                            <p className="footprint-pictogram__label">{row.label}</p>
                            <p className="footprint-pictogram__scale">1 icon = {formatCompact(row.perIcon)}</p>
                        </div>
                        <div className="footprint-pictogram__icons" aria-hidden="true">
                            {Array.from({ length: row.iconCount }).map((_, i) => (
                                <i key={i} className={row.icon} />
                            ))}
                        </div>
                        <p className="footprint-pictogram__value">{row.value}</p>
                    </div>
                ))}
            </div>
        </ChartFrame>
    )
}
