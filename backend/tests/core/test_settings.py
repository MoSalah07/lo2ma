from app.core.settings import Settings


def test_the_database_password_never_shows(settings: Settings) -> None:
    assert "lo2ma:lo2ma" not in repr(settings)
    assert "lo2ma:lo2ma" not in str(settings.model_dump())
