from typing import Any

from fastapi import FastAPI

from app.openapi import OPENAPI_FILE, render


def test_the_api_client_has_the_current_schema() -> None:
    current = OPENAPI_FILE.read_text(encoding="utf-8") if OPENAPI_FILE.exists() else ""
    assert current == render(), "openapi.json is out of date: npm run api:generate"


def test_says_every_error_is_a_code_and_never_a_422(app: FastAPI) -> None:
    schema: dict[str, Any] = app.openapi()
    for path, operations in schema["paths"].items():
        for method, operation in operations.items():
            responses = operation["responses"]
            assert "422" not in responses, f"{method.upper()} {path}"
            error = responses["default"]["content"]["application/json"]["schema"]
            assert error == {"$ref": "#/components/schemas/ApiError"}
    schemas = schema["components"]["schemas"]
    assert "HTTPValidationError" not in schemas
    assert schemas["ApiError"]["required"] == ["code"]
