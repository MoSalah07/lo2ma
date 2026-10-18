import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.exc import InvalidRequestError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import SessionDep
from app.core.settings import Settings
from app.main import create_app, make_lifespan

pytestmark = pytest.mark.anyio


@pytest.fixture
def app(settings: Settings) -> FastAPI:
    """The real app, plus a route that asks the database something."""
    app = create_app(settings)

    @app.get("/api/postgis")
    async def postgis(session: SessionDep) -> str | None:
        async with session.begin():
            return await session.scalar(text("SELECT postgis_lib_version()"))

    return app


async def test_the_migrations_install_the_extensions(session: AsyncSession) -> None:
    installed = set(await session.scalars(text("SELECT extname FROM pg_extension")))
    assert {"postgis", "vector", "pg_trgm"} <= installed


async def test_a_request_gets_a_session(db_client: AsyncClient) -> None:
    response = await db_client.get("/api/postgis")
    assert response.status_code == 200
    assert response.json().startswith("3.")


async def test_the_lifespan_opens_one_pool_and_closes_it(app: FastAPI, settings: Settings) -> None:
    async with (
        make_lifespan(settings)(app) as state,
        state["session_factory"]() as session,
        session.begin(),
    ):
        assert await session.scalar(text("SELECT 1")) == 1


async def test_a_query_outside_a_transaction_fails_at_once(
    app: FastAPI, settings: Settings
) -> None:
    # autobegin is off: a forgotten `session.begin()` shows up here, not as a stray transaction.
    async with make_lifespan(settings)(app) as state, state["session_factory"]() as session:
        with pytest.raises(InvalidRequestError, match="Autobegin is disabled"):
            await session.scalar(text("SELECT 1"))


async def test_a_service_commits_inside_the_test(session: AsyncSession) -> None:
    # What a service does. In a test, its commit is a savepoint the test's rollback undoes.
    async with session.begin():
        await session.execute(text("CREATE TABLE isolation_probe (id integer)"))
        await session.execute(text("INSERT INTO isolation_probe VALUES (1)"))
    assert await session.scalar(text("SELECT count(*) FROM isolation_probe")) == 1


async def test_the_next_test_starts_clean(session: AsyncSession) -> None:
    # Runs after the one above: its table and row are gone.
    assert await session.scalar(text("SELECT to_regclass('isolation_probe')")) is None


def test_the_models_match_the_migrations(migrations: Config, migrated_database: None) -> None:
    # Fails when a model changed without a migration, like `alembic check`.
    command.check(migrations)
