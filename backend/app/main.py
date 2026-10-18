from fastapi import FastAPI
from fastapi.routing import APIRoute

from app.core import health
from app.core.errors import install_error_handlers
from app.core.settings import Settings


def operation_id(route: APIRoute) -> str:
    """The function's name: the generated client gets read_prefs, not read_prefs_api_prefs_get."""
    return route.name


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or Settings()
    # The docs show every endpoint and schema: handy everywhere but in production.
    docs = settings.environment != "prod"
    app = FastAPI(
        title="Lo2ma API",
        generate_unique_id_function=operation_id,
        # One schema per model, like zod: UserPrefs, not UserPrefs-Input and UserPrefs-Output.
        separate_input_output_schemas=False,
        docs_url="/docs" if docs else None,
        redoc_url=None,
        openapi_url="/openapi.json" if docs else None,
    )
    install_error_handlers(app)
    app.include_router(health.router)
    return app


app = create_app()
