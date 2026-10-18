import asyncio
import os
import sys
from collections.abc import AsyncIterator, Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import SecretStr
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from app.core.db import create_db_engine, get_session
from app.core.settings import Settings
from app.main import create_app

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


@pytest.fixture(scope="session")
def settings() -> Settings:
    return Settings(environment="test", database_url=SecretStr(TEST_DATABASE_URL))


@pytest.fixture
def app(settings: Settings) -> FastAPI:
    return create_app(settings)


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    """Calls the app in memory, the way the web app calls it over HTTP. No database."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
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
async def session(engine: AsyncEngine) -> AsyncIterator[AsyncSession]:
    """A session inside a transaction that is rolled back after the test, so tests never see each
    other's rows. A service's own `session.begin()` becomes a savepoint inside it."""
    async with engine.connect() as connection:
        transaction = await connection.begin()
        async with AsyncSession(
            bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
        ) as session:
            yield session
        await transaction.rollback()


@pytest.fixture
async def db_client(app: FastAPI, session: AsyncSession) -> AsyncIterator[AsyncClient]:
    """Like `client`, with every SessionDep given the test's session."""
    app.dependency_overrides[get_session] = lambda: session
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
