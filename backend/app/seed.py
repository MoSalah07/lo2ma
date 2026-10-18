"""Fills the database with the demo data: `npm run db:seed`. Running it again updates the rows."""

import asyncio
import logging
import sys

from app.core.db import create_db_engine, create_session_factory
from app.core.settings import load_settings
from app.features.catalog.seed import load_catalog, seed_catalog
from app.features.places.seed import load_places, seed_places

logger = logging.getLogger("app.seed")


async def seed() -> None:
    engine = create_db_engine(load_settings())
    try:
        async with create_session_factory(engine)() as session, session.begin():
            places = load_places()
            await seed_places(session, places)
            catalog = load_catalog()
            await seed_catalog(session, catalog)
            logger.info(
                "Seeded %d places, %d restaurants and %d dishes",
                len(places),
                len(catalog.restaurants),
                len(catalog.dishes),
            )
    finally:
        await engine.dispose()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    # psycopg's async mode can't run on Windows' default event loop (Proactor).
    asyncio.run(seed(), loop_factory=asyncio.SelectorEventLoop if sys.platform == "win32" else None)
