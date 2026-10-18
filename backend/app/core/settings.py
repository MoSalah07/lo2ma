from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """The configuration, read once at startup from LO2MA_* variables or backend/.env."""

    # The .env file may hold other tools' variables too (Docker Compose's, for one).
    model_config = SettingsConfigDict(env_prefix="LO2MA_", env_file=".env", extra="ignore")

    environment: Literal["dev", "test", "prod"] = "dev"
    # postgresql+psycopg://user:password@host:5432/name. Required, so a missing one stops the app at
    # startup. Secret, so the password never shows in a log or an error.
    database_url: SecretStr


def load_settings() -> Settings:
    """The settings from the environment."""
    # pydantic-settings fills the required fields from the environment; pyright only sees __init__.
    return Settings()  # pyright: ignore[reportCallIssue]
