import pytest
from fastapi import FastAPI
from httpx import AsyncClient

pytestmark = pytest.mark.anyio


async def test_answers_while_the_process_is_up(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_stays_out_of_the_api_contract(app: FastAPI) -> None:
    assert "/health" not in app.openapi()["paths"]
