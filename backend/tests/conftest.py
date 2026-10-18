from collections.abc import AsyncIterator

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.settings import Settings
from app.main import create_app


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.fixture
def app() -> FastAPI:
    return create_app(Settings(environment="test"))


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    """Calls the app in memory, the way the web app calls it over HTTP."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
