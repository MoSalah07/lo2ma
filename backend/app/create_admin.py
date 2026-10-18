"""Adds someone to the operations team: `npm run admin:create -- --email … --name …`.

It asks for the password without showing it, then prints the authenticator link once. Scan it (or
type the secret) into an authenticator app; the dashboard asks for its code after the password.
"""

import argparse
import asyncio
import getpass
import sys

from app.core.db import create_db_engine, create_session_factory
from app.core.settings import load_settings
from app.features.admin_auth.service import create_admin

MIN_PASSWORD = 12


async def main(email: str, name: str, password: str) -> None:
    engine = create_db_engine(load_settings())
    try:
        async with create_session_factory(engine)() as session:
            admin, link = await create_admin(session, email, name, password)
    finally:
        await engine.dispose()
    print(f"Added {admin.email}. Add this to an authenticator app (it isn't shown again):")
    print(link)


def read_password() -> str:
    password = getpass.getpass("Password: ")
    if len(password) < MIN_PASSWORD:
        sys.exit(f"A password needs at least {MIN_PASSWORD} characters.")
    if getpass.getpass("Again: ") != password:
        sys.exit("The passwords don't match.")
    return password


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Add an admin who signs in to the dashboard.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    args = parser.parse_args()
    run = main(args.email, args.name, read_password())
    # psycopg's async mode can't run on Windows' default event loop (Proactor).
    asyncio.run(run, loop_factory=asyncio.SelectorEventLoop if sys.platform == "win32" else None)
