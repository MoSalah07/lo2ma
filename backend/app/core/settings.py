from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """The configuration, read once at startup from LO2MA_* variables or backend/.env."""

    # The .env file may hold other tools' variables too (Docker Compose's, for one).
    model_config = SettingsConfigDict(env_prefix="LO2MA_", env_file=".env", extra="ignore")

    environment: Literal["dev", "test", "prod"] = "dev"
