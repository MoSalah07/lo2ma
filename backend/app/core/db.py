"""The database: the base class of every table, the engine, and one session per request."""

from collections.abc import AsyncIterator
from datetime import datetime
from typing import Annotated, ClassVar

from fastapi import Depends, Request
from sqlalchemy import DateTime, MetaData
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.settings import Settings

# Every constraint and index gets a predictable name, so a later migration can find it to change or
# drop it. It must exist before the first table: renaming them all later is a migration of its own.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

type SessionFactory = async_sessionmaker[AsyncSession]


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)
    # A datetime column is a moment, stored in UTC: timestamptz, never a timestamp without a zone.
    type_annotation_map: ClassVar[dict[type[datetime], DateTime]] = {
        datetime: DateTime(timezone=True)
    }


def create_db_engine(settings: Settings) -> AsyncEngine:
    """The connection pool. Making it connects to nothing; the first query does."""
    return create_async_engine(
        settings.database_url.get_secret_value(),
        pool_size=5,
        max_overflow=5,
        # A connection that died while idle (a database that sleeps, like Neon) is replaced.
        pool_pre_ping=True,
    )


def create_session_factory(engine: AsyncEngine) -> SessionFactory:
    return async_sessionmaker(
        engine,
        # Objects stay readable after a commit: async code can't reload them behind your back.
        expire_on_commit=False,
        # Every query runs inside an explicit `async with session.begin()`. A query outside one
        # fails at once, instead of quietly opening a transaction that breaks the next begin().
        autobegin=False,
    )


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    """One session per request, closed after the response.

    It never begins or commits: the service the route calls does, with `async with session.begin()`,
    around all its reads and writes. So the commit happens before the response goes out, and a
    service can still commit what must stay (a failed sign-in attempt) before it refuses.
    """
    factory: SessionFactory = request.state.session_factory
    async with factory() as session:
        yield session


SessionDep = Annotated[AsyncSession, Depends(get_session)]
