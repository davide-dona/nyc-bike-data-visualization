from pathlib import Path
from typing import Annotated

from pydantic import field_validator
from pydantic_settings import (
    BaseSettings,
    NoDecode,
    SettingsConfigDict,
    YamlConfigSettingsSource,
)

BACKEND_ROOT = Path(__file__).resolve().parent

class BackendSettings(BaseSettings):
    """Backend configuration.

    All values come from config.yaml next to this module — there are no code
    defaults, so a missing key fails loudly at startup. Environment variables
    (uppercased field name) override the YAML; empty env vars are treated as
    unset. DATABASE_URL is deploy-specific and env-only.
    """

    model_config = SettingsConfigDict(
        yaml_file=BACKEND_ROOT / "config.yaml",
        env_ignore_empty=True,
    )

    # Database (env-only, not stored in config.yaml)
    database_url: str
    pool_min_conn: int
    pool_max_conn: int

    # GBFS feed URLs and constants (Lyft/Citi Bike)
    info_url: str
    status_url: str
    gbfs_cache_ttl_seconds: int
    gbfs_classic_bike_type_id: str
    gbfs_ebike_type_id: str

    # Logging (level name accepted by logging.setLevel, e.g. "INFO", "DEBUG")
    log_file_path: str
    log_level: str

    # CORS allowed origins (comma-separated when given via env var)
    cors_origins: Annotated[list[str], NoDecode]

    # Test fixtures
    test_data_dir: Path

    @field_validator("cors_origins", mode="before")
    @classmethod
    def _split_csv(cls, v):
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v

    @field_validator("test_data_dir", mode="after")
    @classmethod
    def _resolve_against_backend_root(cls, v: Path) -> Path:
        return v if v.is_absolute() else BACKEND_ROOT / v

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


settings = BackendSettings()
