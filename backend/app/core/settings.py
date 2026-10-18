from typing import Annotated, Literal, Self

from fastapi import Depends, Request
from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """The configuration, read once at startup from LO2MA_* variables or backend/.env."""

    # The .env file may hold other tools' variables too (Docker Compose's, for one).
    model_config = SettingsConfigDict(env_prefix="LO2MA_", env_file=".env", extra="ignore")

    environment: Literal["dev", "test", "prod"] = "dev"
    # postgresql+psycopg://user:password@host:5432/name. Required, so a missing one stops the app at
    # startup. Secret, so the password never shows in a log or an error.
    database_url: SecretStr
    # Mixed into each sign-in code's hash. It lives here, not in the database, so a leaked table
    # can't be tried against the million possible codes.
    otp_pepper: SecretStr
    # The demo's rule: any six digits sign in, except 000000. For local runs and the end-to-end
    # tests; refused in production.
    otp_demo: bool = False

    @model_validator(mode="after")
    def _no_demo_codes_in_production(self) -> Self:
        if self.otp_demo and self.environment == "prod":
            raise ValueError("LO2MA_OTP_DEMO can't be on in production")
        return self


def load_settings() -> Settings:
    """The settings from the environment."""
    # pydantic-settings fills the required fields from the environment; pyright only sees __init__.
    return Settings()  # pyright: ignore[reportCallIssue]


def get_settings(request: Request) -> Settings:
    """The settings the app was built with (create_app keeps them on app.state)."""
    settings: Settings = request.app.state.settings
    return settings


SettingsDep = Annotated[Settings, Depends(get_settings)]
