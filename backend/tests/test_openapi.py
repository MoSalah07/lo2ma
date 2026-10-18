from app.openapi import OPENAPI_FILE, render


def test_the_api_client_has_the_current_schema() -> None:
    current = OPENAPI_FILE.read_text(encoding="utf-8") if OPENAPI_FILE.exists() else ""
    assert current == render(), "openapi.json is out of date: npm run api:generate"
