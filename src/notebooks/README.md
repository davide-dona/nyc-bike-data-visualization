# Dataset Exploration

[`analysis.ipynb`](analysis.ipynb) is the exploratory-data-analysis notebook behind the
[technical report](../../docs/technical-report/). It documents, explores, and assesses the quality of every dataset used in the project, with the most depth on the Citi Bike trip data.


## Datasets

| Dataset | Source | How the notebook gets it |
|---------|--------|--------------------------|
| **Citi Bike trips** | [Citi Bike system data](https://www.citibikenyc.com/system-data) (S3) | **Manual** — you download one month and drop the CSV in `data/` |
| **Weather** | [Open-Meteo archive API](https://open-meteo.com/) | Fetched live (no setup) |
| **Bike lanes** | [NYC OpenData `mzxg-pwib`](https://data.cityofnewyork.us/d/mzxg-pwib) | Fetched live (no setup) |
| **Station metadata** | [Lyft GBFS feed](https://gbfs.lyft.com/gbfs/2.3/bkn/en/gbfs.json) | Fetched live (no setup) |

Running the notebook therefore requires an internet connection for the weather, bike-lane, and station sections.

## Getting the Citi Bike trip data

1. Open the [Citi Bike system-data page](https://www.citibikenyc.com/system-data) and follow the
   link to the trip-data S3 bucket (`https://s3.amazonaws.com/tripdata/`).
2. Download one monthly archive, e.g. `202406-citibike-tripdata.csv.zip`.
3. Extract it and place the resulting `.csv` file(s) in a `data/` folder **next to this notebook**:

   ```
   src/notebooks/
   ├── analysis.ipynb
   └── data/
       └── 202406-citibike-tripdata.csv
   ```

The notebook reads every `*.csv` in `data/` and concatenates them, so you can drop in more than
one month if you want. `data/` is git-ignored and will not be committed.

> The notebook handles both the modern (2020+) and legacy (pre-2020) file layouts. Dropping in an
> older month is a quick way to reproduce the schema-drift discussion in the data-quality section.

## Running

From the repository root:

```bash
uv run --group notebooks jupyter lab src/notebooks/analysis.ipynb
```

Then run all cells top to bottom.
