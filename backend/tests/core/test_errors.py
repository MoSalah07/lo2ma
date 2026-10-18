from collections.abc import AsyncIterator

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import BaseModel

from app.core.errors import DomainError, invalid_input
from app.core.settings import Settings
from app.main import create_app

pytestmark = pytest.mark.anyio


class DayLockedError(DomainError):
    status = 409
    code = "day_locked"


class Budget(BaseModel):
    budget: int


@pytest.fixture
def app() -> FastAPI:
    """The real app, plus a few routes that fail on purpose."""
    app = create_app(Settings(environment="test"))

    @app.post("/api/plan/swap")
    async def swap() -> None:
        raise DayLockedError()

    @app.put("/api/prefs", openapi_extra=invalid_input("invalid_prefs"))
    async def update_prefs(body: Budget) -> Budget:
        return body

    @app.post("/api/anything")
    async def anything(body: Budget) -> Budget:
        return body

    @app.get("/api/broken")
    async def broken() -> None:
        raise RuntimeError("password=hunter2")

    return app


async def test_a_broken_rule_is_its_status_and_code(client: AsyncClient) -> None:
    response = await client.post("/api/plan/swap")
    assert response.status_code == 409
    assert response.json() == {"code": "day_locked"}


async def test_a_malformed_body_is_400_with_the_routes_own_code(client: AsyncClient) -> None:
    response = await client.put("/api/prefs", json={"budget": "a lot"})
    assert response.status_code == 400
    assert response.json() == {"code": "invalid_prefs"}


async def test_a_route_without_its_own_code_gets_the_general_one(client: AsyncClient) -> None:
    response = await client.post("/api/anything", json={})
    assert response.status_code == 400
    assert response.json() == {"code": "invalid_request"}


async def test_a_valid_body_goes_through(client: AsyncClient) -> None:
    response = await client.put("/api/prefs", json={"budget": 15000})
    assert response.status_code == 200
    assert response.json() == {"budget": 15000}


async def test_an_unknown_path_is_not_found(client: AsyncClient) -> None:
    response = await client.get("/api/nothing-here")
    assert response.status_code == 404
    assert response.json() == {"code": "not_found"}


async def test_a_wrong_method_keeps_405_and_says_what_is_allowed(client: AsyncClient) -> None:
    response = await client.delete("/api/prefs")
    assert response.status_code == 405
    assert response.json() == {"code": "invalid_request"}
    assert response.headers["allow"] == "PUT"


@pytest.fixture
async def lenient_client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    """Answers with the 500 response instead of raising the app's error inside the test."""
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


async def test_a_bug_is_500_and_tells_nothing(lenient_client: AsyncClient) -> None:
    response = await lenient_client.get("/api/broken")
    assert response.status_code == 500
    assert response.json() == {"code": "internal_error"}
    assert "hunter2" not in response.text


async def test_production_hides_the_docs() -> None:
    app = create_app(Settings(environment="prod"))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        assert (await client.get("/docs")).status_code == 404
        assert (await client.get("/openapi.json")).status_code == 404
