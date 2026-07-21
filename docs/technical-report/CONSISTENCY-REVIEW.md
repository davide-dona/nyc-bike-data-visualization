

## A. Claims contradicted by the code or the data

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
