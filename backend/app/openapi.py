"""Writes the API's OpenAPI schema to packages/api-client/openapi.json: `npm run api:generate`.

openapi-typescript turns it into TypeScript types there, and the compiler checks them against the
zod schemas in packages/core. A test fails while the file is out of date.
"""

import json
from pathlib import Path

from pydantic import SecretStr

from app.core.settings import Settings
from app.main import create_app

OPENAPI_FILE = Path(__file__).resolve().parents[2] / "packages" / "api-client" / "openapi.json"


def render() -> str:
    # The schema as development serves it, the demo's stand-ins included. The rest of the settings
    # don't change it, but the app needs some to be built.
    settings = Settings(
        environment="dev",
        database_url=SecretStr("postgresql+psycopg://unused"),
        otp_pepper=SecretStr("unused"),
    )
    return json.dumps(create_app(settings).openapi(), indent=2, ensure_ascii=False) + "\n"


if __name__ == "__main__":
    OPENAPI_FILE.write_text(render(), encoding="utf-8", newline="\n")
