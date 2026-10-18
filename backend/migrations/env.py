"""Alembic's entry point. Migrations run against LO2MA_DATABASE_URL, or the URL a caller passes in
`config.attributes["database_url"]` (the tests do)."""

import logging
from typing import Literal

from alembic import context
from alembic.autogenerate.api import AutogenContext
from geoalchemy2 import Geography
from sqlalchemy import create_engine, pool
from sqlalchemy.schema import SchemaItem

from app.core.settings import load_settings
from app.models import Base

config = context.config
target_metadata = Base.metadata

# No alembic.ini, so no logging section: Alembic's own steps at INFO, everything else at WARNING.
logging.basicConfig(level=logging.WARNING, format="%(levelname)-5.5s [%(name)s] %(message)s")
logging.getLogger("alembic").setLevel(logging.INFO)


def database_url() -> str:
    url = config.attributes.get("database_url")
    if isinstance(url, str):
        return url
    return load_settings().database_url.get_secret_value()


def include_object(
    _item: SchemaItem, _name: str | None, type_: str, reflected: bool, compare_to: SchemaItem | None
) -> bool:
    """Only our own tables: PostGIS adds spatial_ref_sys, and autogenerate would drop it.

    The price: a table removed from the models is never dropped for us, so that migration's
    drop_table is written by hand.
    """
    return not (type_ == "table" and reflected and compare_to is None)


def render_item(type_: str, item: object, autogen_context: AutogenContext) -> str | Literal[False]:
    """A geography column gets its import in the migration (autogenerate forgets it)."""
    if type_ == "type" and isinstance(item, Geography):
        autogen_context.imports.add("from geoalchemy2 import Geography")
        return repr(item)
    return False


def run_migrations_offline() -> None:
    """`alembic upgrade head --sql`: prints the SQL instead of running it."""
    context.configure(
        url=database_url(),
        target_metadata=target_metadata,
        include_object=include_object,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # psycopg serves both: the app connects async, migrations connect sync, on the same URL.
    engine = create_engine(database_url(), poolclass=pool.NullPool)
    with engine.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=include_object,
            render_item=render_item,
        )
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
