# Technical Report — Consistency Review

Review of `docs/technical-report/` against the code, the notebook (`src/notebooks/analysis.ipynb`),
the figures in `docs/media/`, and the live database.

**Nothing in the `.tex` files was changed.** This file only records what does not hold up.

Evidence sources used:

- Code as of branch `technical-report` (commit `d799c7c`).
- Seeded database `citibike` on `localhost:5432`: 78 months, `2020-01-01` → `2026-06-30`, 220,941,537 trips.
- Local parquet under `data/` (bike routes, stations, weather).
- The PNG figures the report actually includes.

Findings are grouped by how wrong they are. Section D lists claims that were checked and **are correct** —
those should not be "fixed" by mistake.

---

## A. Claims contradicted by the code or the data

### A1. Duration outliers are never removed

**Claim** — `chapters/city-bike.tex:125`: *"Since these records do not accurately represent typical
cycling activity, they are removed using reasonable duration thresholds."*

**Reality** — no duration threshold exists anywhere in the pipeline. `_clean_rides_data`
(`src/ingestion/sources/rides.py:233-243`) drops rows with nulls in the required columns, parses the
timestamps, and filters only `ended_at >= started_at`. That is the entire cleaning step. Nothing
downstream filters by duration either.

**Evidence that the outliers survive into the served data** — a single hourly bucket in `stats_hourly`:

| date | hour | user | bike | rides | avg duration |
|---|---|---|---|---|---|
| 2021-03-11 | 05 | casual | classic | 8 | **991.9 h** (≈ 41 days) |
| 2021-03-19 | 00 | casual | classic | 17 | 752.1 h |
| 2021-04-12 | 22 | casual | classic | 23 | 686.9 h |

The distortion is visible at year scale — mean duration per trip:
2020 = **35.5 min**, 2021 = 28.0 min, 2022 = 16.4 min, 2023 = 13.9 min, 2025 = **12.3 min**.
The 2020–2021 figures are not a behavioural trend, they are undeleted multi-week rentals.

The notebook does not remove them either: cell 10 builds `valid = df[(0 <= ride_length_s) & (<= 4h)]`
and uses it **only for the two plots**; `df` itself is never filtered, and every later cell
(distance, user type, temporal, weather join) runs on the unfiltered frame.

**Why it matters** — the report states a cleaning rule the product does not apply, and the resulting
averages are the ones shown to users.

---

### A2. Same-station trips are not excluded

**Claim** — `chapters/city-bike.tex:125`: *"Similarly, trips starting and ending at the same station
are excluded from distance-based analyses."*

**Reality** — there is no exclusion.

- Notebook (cell 13): round trips are dropped from **the histogram only**
  (`df.loc[df["trip_distance_km"] > 0]`). The summary statistics printed immediately above
  (`df["trip_distance_km"].agg([...])`) include them as zeros.
- Production: same-station trips are kept in every count. They end up with a **NULL** distance as a
  side effect, not by design — `compute_and_save_station_distances`
  (`src/ingestion/sources/distances.py:50-58`) pairs each station only with stations after it in the
  sorted list, so self-pairs never exist, and the left join in `enrich_with_distances`
  (`:69-86`) finds no match.

**Why it matters** — "excluded" describes a deliberate filter. What actually happens is a missing join
key, and the trips still contribute to `total_rides` while contributing nothing to `total_distance_km`.

---

### A3. The pipeline has no schema-drift handling

**Claim** — `chapters/city-bike.tex:103`: *"This inconsistency required adjustments in the preprocessing
pipeline to ensure that all monthly files produced compatible features."*

**Reality** — the production pipeline has no legacy handling at all. `src/ingestion/sources/rides.py`
contains no column rename map; it expects `started_at` / `ended_at` and lists `rideable_type` among
`_REQUIRED_RIDE_COLS` (`:25-32`). A legacy file (which uses `starttime` / `stoptime` and has no
`rideable_type`) would either fail at timestamp parsing or, when concatenated with modern files via
`how="diagonal_relaxed"`, have **every one of its rows deleted** by
`drop_nulls(subset=_REQUIRED_RIDE_COLS)` — silently.

The legacy rename map exists only in the notebook (cell 5, `LEGACY_RENAME`). In practice the question
never arises: `default_start_date: "202001"` (`src/ingestion/config.yaml`) means pre-2020 files are
never downloaded.

**Also wrong in the notebook** — cell 28 states *"The production ingestion pipeline
(`src/ingestion/sources/rides.py`) reconciles both layouts the same way."* It does not.

---

### A4. The visualization renders every bike-lane segment, not a sample

**Claim** — `chapters/bike-lanes-dataset.tex:69`: *"For the interactive visualization, only a sample of
segments is rendered to improve responsiveness while preserving the overall spatial pattern."*

**Reality** — nothing is sampled.

- `GET /bike_routes/` (`src/backend/routes/bike_routes.py:8-11`) calls `load_bike_routes`, whose query
  (`src/backend/services/bike_routes.py:7-9`) has no `LIMIT`. It returns all **28,828** rows in the
  `bike_routes` table.
- The frontend filters by year and by hidden facility classes only
  (`src/frontend/features/map/utils/buildDeckLayers.js:78`) — never by count.

The 800-segment sample is in the **notebook's** folium map (cell 51: `routes.dropna(...).head(800)`),
which is a different artefact from the application.

---

### A5. Installation dates are never missing

**Claim** — `chapters/bike-lanes-dataset.tex:67`: *"Installation and retirement dates are occasionally
missing, causing slight underestimation in historical summaries."*

**Reality** — checked over the full dataset (`data/bike_routes/bike_routes.parquet`, 28,983 rows):

- `instdate` null count: **0**
- `instdate` unparseable with `%m/%d/%Y`: **0**

The sentence also contradicts the one that follows it in the same paragraph: the report itself explains
that NYC OpenData writes the sentinel `01/01/1900` *instead of* leaving the field blank. Both cannot be
true. The sentinel claim is the correct one (**244 rows**, and 1900 is indeed the first bar in
`installation_timeline.png`).

`ret_date` is null for 23,810 rows, but that is not missing data — those are the segments that are still
in service (`status = Current`, 23,807 rows).

**Same error in the notebook** — cell 49: *"`instdate` is missing for some legacy segments, so the
earliest years are under-counted."*

---

### A6. There are no invalid geometries, and nothing filters them

**Claim** — `chapters/bike-lanes-dataset.tex:69`: *"Records with missing or invalid geometries cannot be
displayed and are filtered before mapping."*

**Reality** — `the_geom` null count is **0** across all 28,983 rows, and no filtering code exists:
`upsert_bike_routes` (`src/ingestion/db/loaders/bike_routes.py`) inserts every row, and the backend
selects every row. The schema declares `the_geom TEXT NOT NULL` (`postgres/schemas/006_bike_routes.sql`).

---

### A7. The weather data are not observations, and not from Central Park

**Claim** — `chapters/weather-dataset.tex:6` *"hourly weather observations"*; `:68` *"the dataset
represents weather at a single observation location rather than capturing microclimate differences"*.
The notebook is more specific and equally wrong: *"we use a single weather station (Central Park)"*.

**Reality** — `https://archive-api.open-meteo.com/v1/archive` serves **ERA5 reanalysis**, a gridded
model product. No weather station is involved. The API itself demonstrates this — requesting the
configured coordinates returns a *different* point back:

```
requested : latitude 40.7823234, longitude -73.9654161   (Central Park, per config.yaml nyc_coords)
returned  : latitude 40.808434,  longitude -74.0199      (elevation 39 m)
```

The response coordinates are the **centre of the grid cell**, roughly 4.5 km NNW of the requested point
and on the Hudson / New Jersey side of Manhattan.

**Why it matters** — the stated limitation is wrong in kind, not just in wording. The real limitation is
grid resolution and model interpolation, not "one station cannot represent five boroughs". As written it
also implies a precision (a named park) that the data does not have.

---

### A8. `weather_trends.png` shows no time axis, so it cannot show seasonality

**Claim** — `chapters/weather-dataset.tex:38`: *"Figure 5 summarizes the main weather distributions and
their seasonal behaviour"*, supporting *"Temperature follows a clear annual cycle"* and *"Wind speed
shows moderate variation throughout the year"*. Caption (`:43`): *"Temperature, wind speed and
precipitation distributions **over time**."*

**Reality** — the figure is three histograms (temperature, wind speed, precipitation > 0), produced by
notebook cell 35. Counts on the y-axis, values on the x-axis. **There is no time dimension in it.**
Nothing about an annual cycle or year-round variation can be read from it.

The notebook *does* produce the monthly-mean temperature line plot that would support the claim, and it
was exported — `docs/media/temperature_trend.png` exists — but no chapter includes it.

---

### A9. `rides_type.png` does not show what the text says it shows

**Claim** — `chapters/city-bike.tex:69`: *"Members generally show more regular commuting patterns, while
casual users tend to have shorter-term and more variable usage patterns, **as shown in Figure 3**."*

**Reality** — the figure is two count bar charts: rides by `rideable_type` (electric ≈ 3.38 M, classic
≈ 1.30 M) and rides by `member_casual` (member ≈ 3.83 M, casual ≈ 0.86 M). It carries no information
about regularity, time of day, trip length, or variability. It supports "members take most trips" and
nothing else in that sentence.

Two further problems:

- The caption (`:74`) is *"Distribution of trips by user type"*, but half the figure is about bike type.
- *"shorter-term"* contradicts the notebook's own finding (cell 17): *"casual riders, though fewer, take
  **longer** trips on average (leisure use)"*.

---

### A10. `rides_time.png` is start-hour and weekday/weekend — not what the report claims

**Claim** — caption `chapters/city-bike.tex:56`: *"Distribution of trips by hour of the day **and day of
the week**."*

**Reality** — the figure (notebook cell 19) plots mean rides per hour split into **Weekday vs Weekend**,
two categories. It is not a day-of-week breakdown. (The notebook has a separate day-of-week countplot in
cell 22; it is not the exported figure.)

**More serious** — the figure uses the **start** timestamp (`df["start_hour"] = df["started_at"].dt.hour`,
`df["day_of_week"] = df["started_at"].dt.day_name()`), which directly contradicts the report's own
feature definitions at `:34-35`: *"Day of the Week: the weekday extracted from the **end** timestamp […]
Hour of the Day: the hour extracted from the **end** timestamp, for the same reason."*

The production pipeline does use `ended_at` (`_add_partition_columns`,
`src/ingestion/sources/rides.py:245-258`). So the report describes the pipeline correctly and then
illustrates it with a figure computed the other way. The two are not interchangeable at the boundaries
(midnight hours, month ends), and the text does not acknowledge the difference.

---

### A11. `station_capacity.png` cannot show empty or saturated stations

**Claim** — `chapters/station-metadata-dataset.tex:46`: *"Live availability of bikes and docks highlights
possible imbalances, such as empty or saturated stations. The corresponding distributions are shown in
Figure 8."*

**Reality** — the right panel of that figure is **two bars**: system-wide totals (≈ 34,000 bikes
available, ≈ 31,000 docks available), from notebook cell 57 (`stations[[...]].sum()`). A system-wide sum
is exactly the aggregation that hides per-station imbalance. The word "distributions" is also wrong for
the right panel — only the left panel (capacity) is a distribution.

The notebook does compute empty stations elsewhere, and the backend exposes `/stations/empty`
(`src/backend/routes/stations.py:24-42`), but neither is what this figure shows.

---

### A12. `capacity` is total docks, not available docks

**Claim** — `chapters/station-metadata-dataset.tex:20`: *"**Capacity**: number of available docks."*

**Reality** — in GBFS, `capacity` is the number of docking points **installed** at the station. Available
docks is a separate, live field, `num_docks_available`, which the report lists two items later at `:26`.
As written, the two entries describe the same thing. The report's own figure caption (`:53`) gets it
right — *"station capacity (number of docks)"* — and so does the figure's x-axis label ("Docks").

---

### A13. There is no "normalized" short name

**Claim** — `chapters/city-bike.tex:129`: *"stations are uniquely identified using the normalized short
name."*

**Reality** — no normalization step exists. `short_name` is used as a raw string everywhere:
`distances.py:38` (`"id": s.get("short_name", "")`), `station_metadata.py` (`s["short_name"]` inserted
as `station_id`), `gbfs.py:96` and `:130` (`str(station_data["short_name"])`). A grep for
`normaliz|strip()|lower()` over `src/ingestion/` and `src/backend/` returns only unrelated hits (CORS
parsing, WKT prefix matching, filename handling).

The join is a plain string equality on the identifier as published. Either drop "normalized" or
implement it.

---

### A14. No duplicate-identifier handling exists

**Claim** — `chapters/station-metadata-dataset.tex:86`: *"Additional issues, such as temporary feed
outages or duplicate identifiers caused by station changes, are handled through preprocessing checks to
maintain reliable visualizations."*

**Reality** — half true, and the true half is not a "preprocessing check":

- Feed outages: real, and handled — `fetch_station_data` falls back to the stale cache and otherwise
  raises 503 (`src/backend/services/gbfs.py:74-84`). That is runtime error handling.
- Duplicate identifiers: **nothing exists**. The only related line is
  `ON CONFLICT (station_id) DO NOTHING` in `upsert_station_metadata`, which silently keeps whichever
  row arrived first — that is not a check, and it detects nothing.

---

### A15. No station is missing capacity or coordinates

**Claim** — `chapters/station-metadata-dataset.tex:82`: *"A small number of records may have missing
capacity or coordinates. Stations without coordinates cannot be displayed on maps, while missing
capacity only affects analyses based on station size."*

**Reality** — in `data/stations/station_metadata.parquet` (2,462 stations):
`capacity` nulls = **0**, `lat`/`lon` nulls = **0**.

There *is* a real finding here that the report misses: **42 stations report `capacity = 0`**. Those are
not null, so no null check catches them, and they will silently distort any per-capacity computation
(and any division by capacity). "May have missing values" is a hedge; "42 stations report zero capacity"
is a fact.

---

## B. Claims the data does not support as stated

### B1. Bike lanes are not concentrated in Manhattan and Brooklyn

**Claim** — `chapters/bike-lanes-dataset.tex:39`: *"bike-lane segments are concentrated in Manhattan and
Brooklyn, while the remaining boroughs contain fewer segments."*

**Reality** — actual counts (28,983 segments):

| Borough | Segments | Share |
|---|---|---|
| Manhattan | 7,906 | 27.3 % |
| Brooklyn | 7,363 | 25.4 % |
| Queens | 6,867 | 23.7 % |
| Bronx | 5,359 | 18.5 % |
| Staten Island | 1,488 | 5.1 % |

Queens is within 500 segments of Brooklyn. Four boroughs sit between 18 % and 27 %. The only borough
that is genuinely an outlier is Staten Island, at the bottom. "Concentrated in Manhattan and Brooklyn"
is not what `segments_concentration.png` shows.

---

### B2. The temperature "plateaus" are mislabelled by one bin

**Claim** — `chapters/weather-dataset.tex:47`: *"Two plateaus are observed between 15 °C and 20 °C, and
between 25 °C and 30 °C. With higher temperatures, ridership increases noticeably."*

**Reality** — `rides_vs_temp.png` uses 5 °C-wide bins labelled by their **lower edge**
(`temp_bin = temperature // 5 * 5`, notebook cell 38). Read values:

| bin label | covers | mean rides/h |
|---|---|---|
| 5 | 5–10 | ≈ 2,150 |
| 10 | 10–15 | ≈ 3,700 |
| 15 | 15–20 | ≈ 7,150 |
| 20 | 20–25 | ≈ 7,650 |
| 25 | 25–30 | ≈ 10,050 |
| 30 | 30–35 | ≈ 10,050 |
| 35 | 35+ | ≈ 13,700 |

A plateau needs two adjacent bins at a similar level. Those are bins 15 and 20 (i.e. **15–25 °C**) and
bins 25 and 30 (i.e. **25–35 °C**). As written, each stated interval names a *single* bin, inside which
the figure shows nothing at all.

---

### B3. Nothing in the analysis covers "inclement weather"

**Claim** — `chapters/weather-dataset.tex:47`: *"ridership […] is higher during warmer periods and lower
during cold or **inclement** weather."*

**Reality** — the only ridership-vs-weather analysis performed is against **temperature** (cell 38).
Precipitation and `weather_code` are downloaded, described, and plotted as standalone distributions, but
never related to ridership. The claim about inclement weather has no supporting analysis in the notebook
or the report.

(The application *does* support precipitation and weather-code bucketing —
`_WEATHER_EXPRS` in `src/backend/services/ride_stats.py:24-32` — so the analysis is feasible; it just
was not done.)

---

## C. Missing context that changes how the report should be read

### C1. The trip-level analysis never states how much data it covers

The Citi Bike chapter presents its findings as properties of "the dataset", without saying which period
they come from. They come from whatever CSVs happen to sit in `src/notebooks/data/` — `load_rides`
(cell 5) globs the directory. `src/notebooks/README.md` tells the reader to download one month and adds
that they may add "more than one month if you want", so the extent of the analysis is not fixed by the
notebook either: it depends on the machine it was last run on.

The exported figures total ≈ 4.69 M trips (from `rides_type.png`: 3.38 M + 1.30 M). The application, by
contrast, serves **220,941,537 trips over 78 months** (2020-01 → 2026-06).

So general statements — trip duration distribution, member/casual split, the electric-vs-classic ratio,
the temperature response — rest on well under 3 % of the data, from an unstated period, and the
electric/classic ratio in particular is strongly time-dependent:

| Year | classic | electric |
|---|---|---|
| 2020 | 16.8 M | 2.7 M |
| 2023 | 17.5 M | 17.5 M |
| 2025 | 13.5 M | 32.1 M |

The report should state the exact months used, or the reader cannot tell which findings generalise.

---

### C2. Trip distance uses *current* station coordinates — 6 % of trip endpoints get none

The report describes trip distance (`:33`) as *"the distance between the start and end stations"*, and
its only distance caveat (`:127`) is that Haversine approximates the real route. There is a second,
larger caveat that is not mentioned.

In production, distance is **not** computed from the trip's own recorded coordinates. It comes from a
precomputed station-pair table built from the **live GBFS feed**
(`compute_and_save_station_distances`, `src/ingestion/sources/distances.py:34-58`) and left-joined onto
the trips. Any station that has since been removed or renumbered is absent from that table, so its trips
get a NULL distance and silently contribute 0 to `total_distance_km`.

Measured on the live database:

- distinct station ids appearing in trips: **2,788**
- stations present in `station_metadata` (current feed): **2,472**
- trip station ids with no match: **394**
- ride endpoints at unmatched stations: **26,432,404 of 439,577,262 = 6.0 %**

This biases distance downward, and the bias grows the further back you look — which is consistent with
the mean distance per trip rising monotonically from 1.98 km (2020) to 2.52 km (2026). Part of that
"trend" is decommissioned stations dropping out, not longer rides.

The notebook does not have this problem (cell 13 computes distance from the trip's own lat/lng), which
is another place where notebook and production differ without the report saying so.

---

### C3. Chapter numbering does not match chapter order

The chapters are ordered in `technical-report.tex:8-11` as: City Bike, Station Metadata, Weather, Bike
Lanes. But each chapter's opening line numbers itself differently:

| Position in document | Chapter | Calls itself |
|---|---|---|
| 1 | City Bike | "main source" |
| 2 | Station Metadata | *"our **fourth** source of data"* (`:3`) |
| 3 | Weather | *"our **second** data source"* (`:2`) |
| 4 | Bike Lanes | *"our **third** data source"* (`:2`) |

A reader hits "fourth" on page 2 and "second" on page 3.

---

### C4. "Trips Flow […] for each pair of stations and time period" is monthly only

`chapters/city-bike.tex:41` describes the flow aggregate with an unqualified "time period". The table
has exactly one time granularity: `(year, month)`
(`insert_flow_activity_monthly`, `src/ingestion/db/loaders/flow_activity_monthly.py:11-22`;
`postgres/schemas/003_flow_activity_monthly.sql`).

This is worth being precise about because the sibling aggregate is *not* monthly-only — station activity
is materialised at four granularities (hourly, by month, by hour-of-day, by day-of-week —
`src/ingestion/db/loaders/station_activity.py:12-17`). The two are described in adjacent bullets in the
same style, which implies a symmetry that does not exist.

---

### C5. `temperature_trend.png` is exported but never used

`docs/media/temperature_trend.png` is produced by the notebook and committed, but no chapter includes
it. See A8 — it is the figure that would actually support the seasonality claim.

---

### C6. Forward-looking warning for the final report: D3 is not used

Not a technical-report issue, but it will become one in `docs/report/chapters/visualization.tex`. The
proposal (`docs/proposal/chapters/solution.tex`) states *"D3.js will handle temporal and categorical
charts"*. `d3` is declared in `src/frontend/package.json`, but **no source file imports it** — a grep for
d3 imports across `features/`, `utils/` and `components/` returns nothing. The charts are rendered with
`react-plotly.js`. The Visualization chapter should say Plotly.

---

## D. Checked and correct — do not "fix" these

| Claim | Verified against |
|---|---|
| Circuity factor 1.3, Haversine, Earth radius 6371 km | `config.yaml`; `distances.py:14-24` |
| Trip duration = `ended_at − started_at`, in seconds | `rides.py:255-257` |
| Hour / day-of-week / partition derived from `ended_at` | `rides.py:245-258` (production; but see A10) |
| Monthly files are grouped by end date | Consistent with the data: the 2026-06 file produced no July partition and `max(date) = 2026-06-30`, which start-month grouping would not produce. Indirect but consistent. |
| GBFS feed 2.3 `bkn`, `station_information` + `station_status` | `src/backend/config.yaml` |
| `active` = `is_installed` ∧ `is_renting` ∧ `is_returning`, used to filter live views | `gbfs.py:36-44`; `routes/stations.py:21,32` |
| Weather: hourly, `America/New_York`, `temperature_2m` / `precipitation` / `weather_code` / `wind_speed_10m`, `Year` used for parquet partitioning | `weather.py:69-91` |
| Weather data are complete, hourly, no missing values | `weather_hourly` = **56,952** rows, exactly the number of hours in 2020-01-01 → 2026-06-30; 0 nulls |
| Precipitation is strongly right-skewed; histograms use non-zero values only | notebook cell 35 |
| Dropped bike-lane columns `prevbikeid`, `gwsys2`, `spur`, `ft2facilit`, `tf2facilit` | `bike_routes.py:23` |
| `01/01/1900` sentinel is the lower bound of the timeline | 244 rows; first bar of `installation_timeline.png` |
| Most bike-lane infrastructure is current | Current 23,807 / Retired 5,176 = **82 % current** |
| Facility class is used to style the network | `bikeRoutesLayer.js:61` (`FACILITY_COLORS`) |
| Rideable type is only classic / electric | `stats_hourly` holds exactly `classic_bike` and `electric_bike` across all 78 months — no `docked_bike` |
| User type is only member / casual | member 176,450,523 / casual 44,491,014 |
| Station id ≠ short name; joins must go through short name | `station_metadata.parquet`: `station_id` is a UUID, `short_name` is e.g. `5785.05` |
| Trips are concentrated in commuting hours; weekends differ | `rides_time.png`: weekday peaks at 08 and 17–18, weekend single midday hump |
| Most trips are short | `rides_duration.png`: median 9.5 min |

---

## Suggested priority

1. **A1, A2, A3** — these describe cleaning that does not happen. They are the ones a reviewer can
   disprove by running the pipeline, and A1 measurably distorts the numbers the app displays.
2. **A7** — wrong about what the data source *is*, not just how it is worded.
3. **A8, A9, A10, A11** — text and figures disagree; each is visible by looking at the figure.
4. **C1, C2** — missing caveats that change how much weight the findings can carry.
5. **A4, A5, A6, A12, A13, A14, A15, B1, B2, B3** — individually small, all factually wrong.
6. **C3, C4, C5** — presentation and precision.
