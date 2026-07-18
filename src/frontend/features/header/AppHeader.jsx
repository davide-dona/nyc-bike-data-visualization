import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import DateWindowPicker from "./components/DateWindowPicker.jsx";
import useHeaderFilters from "./hooks/useHeaderFilters.js";
import RiderBikeFilter from "./components/RiderBikeFilter.jsx";
import { useDatasetDateRange } from "./hooks/useDatasetDateRange.js";
import useSafeIsFetching from "./hooks/useSafeIsFetching.js";
import useDateRangeSeed from "./hooks/useDateRangeSeed.js";
import useLockHint from "./hooks/useLockHint.js";
import FloatingTooltip from "@/components/FloatingTooltip.jsx";
import { HEADER_TEXT } from "./utils/headerText.js";

const PAGES = [
    { to: "/map", label: "Map", icon: "fa-solid fa-map-location-dot" },
    { to: "/temporal", label: "Temporal", icon: "fa-solid fa-clock" },
    { to: "/weather", label: "Weather", icon: "fa-solid fa-cloud-sun" },
    { to: "/footprint", label: "Footprint", icon: "fa-solid fa-leaf" },
];

/**
 * App header: title, nav links, and the date range filter.
 */
function AppHeader({ onFiltersChange, forceDisableFilters = false }) {
    const location = useLocation();
    const isTemporalRoute = location.pathname === "/temporal";
    const {
        dateRange,
        currentUserFilters,
        handleDateRangeCommit,
        handleUserFilterChange,
    } = useHeaderFilters(onFiltersChange);
    const { dateRange: datasetRange, loading: datasetRangeLoading } = useDatasetDateRange();
    const activeDataFetches = useSafeIsFetching();
    const areDateFiltersDisabled = datasetRangeLoading || activeDataFetches > 0;
    const areUserFiltersDisabled = forceDisableFilters;
    const shouldShowLockHint = isTemporalRoute && forceDisableFilters;
    const kicker =
        datasetRange?.min_date && datasetRange?.max_date
            ? `NYC / ${datasetRange.min_date.slice(0, 4)}–${datasetRange.max_date.slice(0, 4)}`
            : "NYC";

    useDateRangeSeed({ datasetRange, dateRange, onCommit: handleDateRangeCommit });

    const {
        isLockHintVisible,
        lockHintPosition,
        lockHintRef,
        updateLockHintPosition,
        hideLockHint,
    } = useLockHint({ isActive: shouldShowLockHint });

    return (
        <header className="app-header">
            <div className="app-header__topbar">
                <div className="app-header__brand">
                    <span className="app-header__kicker">{kicker}</span>
                    <h1 className="app-title">
                        Citi Bike,{" "}
                        <span className="app-title__in-motion">
                            <span>i</span>
                            <span>n</span>
                            <span>&nbsp;</span>
                            <span>m</span>
                            <span>o</span>
                            <span>t</span>
                            <span>i</span>
                            <span>o</span>
                            <span>n</span>
                            <span>.</span>
                        </span>
                    </h1>
                </div>
                <nav className="app-header__nav">
                    {PAGES.map(({ to, label, icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                isActive ? "nav-link active" : "nav-link"
                            }
                        >
                            <span className="nav-link__icon" aria-hidden="true">
                                <i className={icon} />
                            </span>
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className="app-header__filters">
                <div className="app-header__filters-group">
                    <DateWindowPicker
                        value={dateRange}
                        onCommit={handleDateRangeCommit}
                        disabled={areDateFiltersDisabled}
                    />
                    <div
                        className={`app-header__filter-lockzone${shouldShowLockHint ? " is-locked" : ""}`}
                        onMouseEnter={updateLockHintPosition}
                        onMouseMove={updateLockHintPosition}
                        onMouseLeave={hideLockHint}
                    >
                        <RiderBikeFilter
                            value={currentUserFilters}
                            onChange={handleUserFilterChange}
                            disabled={areUserFiltersDisabled}
                        />
                    {shouldShowLockHint && (
                        <FloatingTooltip
                            visible={isLockHintVisible}
                            position={lockHintPosition}
                            nodeRef={lockHintRef}
                            role="note"
                            ariaLive="polite"
                            className="app-header__filter-lock-hint"
                        >
                            {HEADER_TEXT.lockHint}
                        </FloatingTooltip>
                    )}
                    </div>
                </div>
            </div>
        </header>
    );
}

export default AppHeader;
