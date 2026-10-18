from collections.abc import AsyncGenerator, Callable
from contextlib import AbstractAsyncContextManager, asynccontextmanager
from typing import TypedDict

from fastapi import APIRouter, FastAPI
from fastapi.routing import APIRoute

from app.core import health
from app.core.db import SessionFactory, create_db_engine, create_session_factory
from app.core.errors import install_error_handlers
from app.core.settings import Settings, load_settings
from app.features.auth import router as auth
from app.features.places import router as places
from app.features.prefs import router as prefs


class State(TypedDict):
    """What every request finds on `request.state`."""

    session_factory: SessionFactory


def make_lifespan(settings: Settings) -> Callable[[FastAPI], AbstractAsyncContextManager[State]]:
    @asynccontextmanager
    async def lifespan(_app: FastAPI) -> AsyncGenerator[State]:
        # One pool for the whole app, closed when the server stops.
        engine = create_db_engine(settings)
        try:
            yield {"session_factory": create_session_factory(engine)}
        finally:
            await engine.dispose()

    return lifespan


def operation_id(route: APIRoute) -> str:
    """The function's name: the generated client gets read_prefs, not read_prefs_api_prefs_get."""
    return route.name


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or load_settings()
    # The docs show every endpoint and schema: handy everywhere but in production.
    docs = settings.environment != "prod"
    app = FastAPI(
        title="Lo2ma API",
        lifespan=make_lifespan(settings),
        generate_unique_id_function=operation_id,
        # One schema per model, like zod: UserPrefs, not UserPrefs-Input and UserPrefs-Output.
        separate_input_output_schemas=False,
        docs_url="/docs" if docs else None,
        redoc_url=None,
        openapi_url="/openapi.json" if docs else None,
    )
    app.state.settings = settings
    install_error_handlers(app)
    app.include_router(health.router)
    # Everything the apps call lives under /api, the path the web app's rewrite forwards.
    api = APIRouter(prefix="/api")
    api.include_router(auth.router)
    api.include_router(places.router)
    api.include_router(prefs.router)
    app.include_router(api)
    return app
