from pydantic_settings import BaseSettings, PydanticBaseSettingsSource

from app.core.settings import Settings


class IsolatedSettings(Settings):
    """Settings from the arguments alone: not backend/.env, not LO2MA_* variables. The tests mustn't
    change with a developer's settings (LO2MA_DEMO_SIGN_IN, for one)."""

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: PydanticBaseSettingsSource,
        env_settings: PydanticBaseSettingsSource,
        dotenv_settings: PydanticBaseSettingsSource,
        file_secret_settings: PydanticBaseSettingsSource,
    ) -> tuple[PydanticBaseSettingsSource, ...]:
        return (init_settings,)
