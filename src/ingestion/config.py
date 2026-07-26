from datetime import datetime, timedelta
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
    YamlConfigSettingsSource,
)

INGESTION_ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = INGESTION_ROOT.parents[1]

class IngestionSettings(BaseSettings):
    """Ingestion configuration.

    All values come from config.yaml next to this module — there are no code
    defaults, so a missing key fails loudly at startup. Environment variables
    (uppercased field name) override the YAML; empty env vars are treated as
    unset (the seeder image declares its optional vars as empty strings when
    not provided). CLI flags on src.ingestion.cli take precedence over both.
    config.yaml ships a local-development DATABASE_URL; Docker and CI override
    it via the env var.
    """

    model_config = SettingsConfigDict(
        yaml_file=INGESTION_ROOT / "config.yaml",
        env_ignore_empty=True,
    )

    # Database connection URL (local default in config.yaml, env-overridable)
    database_url: str

    # Root data directory; all data paths below derive from it
    data_dir: Path

    # Download URLs
    base_url_ride_data: str
    weather_api_url: str
    bike_routes_url: str

    # Default date range for data ingestion
    default_start_date: str
    default_end_date: str | None
    download_jc: bool
    download_chunk_size_mb: int
    max_cache_age_days: int

    # Parallelism (see config.yaml for sizing guidance)
    parallel_months: int
    db_loader_workers: int

    # Data processing constants
    yearly_cutoff: int
    parquet_compression: str
    street_circuity_factor: float
    earth_radius_km: float
    upper_outlier_z_score: float

    # Weather retrieval settings
    nyc_coords: tuple[float, float]
    weather_timezone: str

    @field_validator("data_dir", mode="after")
    @classmethod
    def _resolve_against_project_root(cls, v: Path) -> Path:
        return v if v.is_absolute() else PROJECT_ROOT / v

    @field_validator("default_end_date", mode="after")
    @classmethod
    def _compute_end_date(cls, v: str | None) -> str:
        """null in YAML = one month ago, the most recent month with a complete data file."""
        return v or (datetime.now() - timedelta(days=30)).strftime("%Y%m")

    @classmethod
    def settings_customise_sources(
        cls, settings_cls, init_settings, env_settings, dotenv_settings, file_secret_settings
    ):
        # Priority: init args > env vars > config.yaml
        return (
            init_settings,
            env_settings,
            dotenv_settings,
            YamlConfigSettingsSource(settings_cls),
            file_secret_settings,
        )

    # Derived data paths, computed from data_dir so an override moves everything together
    @property
    def rides_data_dir(self) -> Path:
        return self.data_dir / "rides"

    @property
    def weather_data_dir(self) -> Path:
        return self.data_dir / "weather"

    @property
    def station_data_dir(self) -> Path:
        return self.data_dir / "stations"

    @property
    def station_distances_path(self) -> Path:
        return self.station_data_dir / "station_pair_distances.parquet"

    @property
    def station_metadata_path(self) -> Path:
        return self.station_data_dir / "station_metadata.parquet"

    @property
    def bike_routes_data_dir(self) -> Path:
        return self.data_dir / "bike_routes"

    @property
    def bike_routes_path(self) -> Path:
        return self.bike_routes_data_dir / "bike_routes.parquet"

    @property
    def daily_stats_data_dir(self) -> Path:
        return self.data_dir / "daily_stats"

    @property
    def daily_stats_path(self) -> Path:
        return self.daily_stats_data_dir / "daily_stats.parquet"


settings = IngestionSettings()
