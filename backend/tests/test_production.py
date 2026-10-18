"""What production never does. Each rule here closes a door a forgotten setting would leave open:
the demo's sign-ins, its stand-in routes and data, the docs."""

from collections.abc import AsyncIterator

import pytest
from httpx import ASGITransport, AsyncClient
from pydantic import SecretStr, ValidationError

from app.core.settings import Settings
from app.main import create_app
from app.seed import DemoDataInProductionError, seed
from tests.settings import IsolatedSettings

pytestmark = pytest.mark.anyio


@pytest.fixture
def production(settings: Settings) -> Settings:
    return settings.model_copy(update={"environment": "prod"})


@pytest.fixture
async def production_client(production: Settings) -> AsyncIterator[AsyncClient]:
    transport = ASGITransport(app=create_app(production))
    async with AsyncClient(transport=transport, base_url="https://test") as client:
        yield client


def test_a_server_must_say_where_it_runs() -> None:
    # No default: a forgotten LO2MA_ENVIRONMENT stops the server instead of making it a dev one.
    # pyright sees the missing argument too; leaving it out is the test.
    with pytest.raises(ValidationError, match="environment"):
        IsolatedSettings(  # pyright: ignore[reportCallIssue]
            database_url=SecretStr("postgresql+psycopg://x"), otp_pepper=SecretStr("x")
        )


def test_refuses_demo_sign_ins(settings: Settings) -> None:
    with pytest.raises(ValueError, match="DEMO_SIGN_IN"):
        Settings.model_validate(
            {**settings.model_dump(), "environment": "prod", "demo_sign_in": True}
        )


async def test_hides_the_docs(production_client: AsyncClient) -> None:
    assert (await production_client.get("/docs")).status_code == 404
    assert (await production_client.get("/openapi.json")).status_code == 404


async def test_serves_no_demo_stand_ins(production_client: AsyncClient) -> None:
    files = {"audio": ("voice", b"voice", "audio/webm")}
    for response in (
        await production_client.get("/api/payment-methods"),
        await production_client.post("/api/chat/transcribe", files=files, data={"locale": "ar"}),
    ):
        assert response.status_code == 404
        assert response.json() == {"code": "not_found"}


async def test_never_takes_the_demo_data(production: Settings) -> None:
    # Refused before it even connects: the made-up coupons would be real discounts.
    with pytest.raises(DemoDataInProductionError):
        await seed(production)
