"""The app the server runs (`fastapi dev`, `fastapi run`), built from the environment's settings.

It lives apart from app/main.py so that importing create_app (the tests, the OpenAPI export) never
needs LO2MA_DATABASE_URL.
"""

from app.main import create_app

app = create_app()
