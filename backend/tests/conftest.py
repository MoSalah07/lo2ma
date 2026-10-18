import asyncio
import os
import sys
from collections.abc import AsyncIterator, Callable, Iterator
from datetime import UTC, datetime
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import SecretStr
from pydantic_settings import BaseSettings, PydanticBaseSettingsSource
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncEngine, AsyncSession

from app.core.db import create_db_engine, get_session
from app.core.now import utc_now
from app.core.settings import Settings
from app.features.catalog.seed import load_catalog, seed_catalog
from app.main import create_app
from tests.clock import Clock

BACKEND = Path(__file__).resolve().parents[1]

# The lo2ma_test database next to the development one (compose.yaml). CI can point elsewhere.
TEST_DATABASE_URL = os.environ.get(
    "LO2MA_TEST_DATABASE_URL", "postgresql+psycopg://lo2ma:lo2ma@127.0.0.1:5432/lo2ma_test"
)


@pytest.fixture(scope="session")
def anyio_backend() -> tuple[str, dict[str, object]]:
    # psycopg's async mode can't run on Windows' default event loop (Proactor).
    options: dict[str, object] = (
        {"loop_factory": asyncio.SelectorEventLoop} if sys.platform == "win32" else {}
    )
    return "asyncio", options


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


@pytest.fixture(scope="session")
def settings() -> Settings:
    return IsolatedSettings(
        environment="test",
        database_url=SecretStr(TEST_DATABASE_URL),
        otp_pepper=SecretStr("test-pepper"),
    )


@pytest.fixture
def app(settings: Settings) -> FastAPI:
    return create_app(settings)


@pytest.fixture
def clock(app: FastAPI) -> Clock:
    """The app's clock, set to Thursday 15 October 2026, 10:00 in Cairo."""
    clock = Clock(datetime(2026, 10, 15, 7, 0, tzinfo=UTC))
    app.dependency_overrides[utc_now] = clock
    return clock


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    """Calls the app in memory, the way the web app calls it. No database.

    Over https, like the browser on localhost: httpx only sends Secure cookies back over https.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as client:
        yield client


@pytest.fixture(scope="session")
def migrations() -> Config:
    """Alembic, pointed at the test database."""
    config = Config(toml_file=BACKEND / "pyproject.toml")
    config.attributes["database_url"] = TEST_DATABASE_URL
    return config


@pytest.fixture(scope="session")
def migrated_database(migrations: Config) -> Iterator[None]:
    """The test database at the newest migration.

    Every run first walks all the migrations down and then up again, so a downgrade that doesn't
    work fails here instead of in production.
    """
    try:
        command.downgrade(migrations, "base")
    except OperationalError as error:
        pytest.exit(
            f"The test database isn't reachable; start it with `npm run db:up`.\n{error}", 1
        )
    command.upgrade(migrations, "head")
    yield


@pytest.fixture(scope="session")
async def engine(settings: Settings, migrated_database: None) -> AsyncIterator[AsyncEngine]:
    engine = create_db_engine(settings)
    yield engine
    await engine.dispose()


@pytest.fixture
async def connection(engine: AsyncEngine) -> AsyncIterator[AsyncConnection]:
    """One connection per test, inside a transaction that is rolled back at the end, so tests never
    see each other's rows."""
    async with engine.connect() as connection:
        transaction = await connection.begin()
        yield connection
        await transaction.rollback()


def session_on(connection: AsyncConnection, *, autobegin: bool = True) -> AsyncSession:
    # A service's own `session.begin()` becomes a savepoint inside the test's transaction.
    return AsyncSession(
        bind=connection,
        join_transaction_mode="create_savepoint",
        expire_on_commit=False,
        autobegin=autobegin,
    )


@pytest.fixture
async def session(connection: AsyncConnection) -> AsyncIterator[AsyncSession]:
    """For a test's own reads and writes, on the test's connection. It begins on its own, unlike
    the app's sessions: setting up and checking rows is all a test does with it."""
    async with session_on(connection) as session:
        yield session


@pytest.fixture
def client_of(connection: AsyncConnection) -> Callable[[FastAPI], AsyncClient]:
    """A client for any app a test builds, on the test's connection. Each request gets its own
    session, as in production (and with autobegin off, as in production), so what one request
    leaves open never leaks into the next."""

    def client_of(app: FastAPI) -> AsyncClient:
        async def request_session() -> AsyncIterator[AsyncSession]:
            async with session_on(connection, autobegin=False) as session:
                yield session

        app.dependency_overrides[get_session] = request_session
        return AsyncClient(transport=ASGITransport(app=app), base_url="https://test")

    return client_of


@pytest.fixture
async def db_client(
    app: FastAPI, client_of: Callable[[FastAPI], AsyncClient]
) -> AsyncIterator[AsyncClient]:
    """Like `client`, with the database."""
    async with client_of(app) as client:
        yield client


@pytest.fixture
def demo_app(settings: Settings, clock: Clock) -> FastAPI:
    """The app as the demo and the end-to-end tests run it (LO2MA_DEMO_SIGN_IN)."""
    app = create_app(settings.model_copy(update={"demo_sign_in": True}))
    app.dependency_overrides[utc_now] = clock
    return app


@pytest.fixture
async def demo_client(
    demo_app: FastAPI, client_of: Callable[[FastAPI], AsyncClient]
) -> AsyncIterator[AsyncClient]:
    async with client_of(demo_app) as client:
        yield client


@pytest.fixture
async def catalog(session: AsyncSession) -> None:
    """The demo's menus (backend/seed), as `npm run db:seed` loads them."""
    async with session.begin():
        await seed_catalog(session, load_catalog())
