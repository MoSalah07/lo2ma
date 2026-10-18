"""The auth part of apps/web/src/mocks/handlers/handlers.test.ts against the real API, and what a
real sign-in has to get right: codes that expire, run out of tries and work once; sending limits."""

from datetime import timedelta
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.auth import service
from app.features.auth.cookie import SESSION_COOKIE
from app.features.auth.models import OtpCodeRecord, SessionRecord
from tests.clock import Clock

pytestmark = pytest.mark.anyio

PHONE = {"channel": "phone", "destination": "010 1234 5678"}
CODE = "482193"


@pytest.fixture(autouse=True)
def known_code(monkeypatch: pytest.MonkeyPatch) -> None:
    """Every code sent in these tests is 482193, so a test can type it."""
    monkeypatch.setattr(service, "new_code", lambda: CODE)


async def sign_in(client: AsyncClient, code: str = CODE, **destination: str) -> Any:
    target = destination or PHONE
    await client.post("/api/auth/otp", json=target)
    response = await client.post("/api/auth/verify", json={**target, "code": code})
    return response


async def test_rejects_a_phone_number_that_is_not_egyptian(db_client: AsyncClient) -> None:
    for destination in (
        {"channel": "phone", "destination": "12345"},
        {"channel": "email", "destination": "me@home"},
    ):
        response = await db_client.post("/api/auth/otp", json=destination)
        assert response.status_code == 400
        assert response.json() == {"code": "invalid_destination"}


async def test_a_malformed_request_is_invalid_destination(db_client: AsyncClient) -> None:
    response = await db_client.post("/api/auth/otp", json={"channel": "pigeon"})
    assert response.json() == {"code": "invalid_destination"}


async def test_sends_a_code_that_works_for_five_minutes(
    db_client: AsyncClient, clock: Clock
) -> None:
    response = await db_client.post("/api/auth/otp", json=PHONE)
    assert response.status_code == 200
    assert response.json() == {"expiresIn": 300}


async def test_signs_in_with_the_code_and_starts_a_session(
    db_client: AsyncClient, clock: Clock
) -> None:
    response = await sign_in(db_client)
    assert response.status_code == 200
    user = response.json()
    # The phone number as the apps write it: national, 10 digits. No email key at all.
    assert user["phone"] == "1012345678"
    assert user["name"] == ""
    assert "email" not in user

    cookie = response.headers["set-cookie"]
    assert cookie.startswith(f"{SESSION_COOKIE}=")
    for attribute in ("HttpOnly", "Secure", "SameSite=lax", "Path=/"):
        assert attribute in cookie
    session = await db_client.get("/api/auth/session")
    assert session.status_code == 200
    assert session.json() == user


async def test_the_same_number_is_the_same_account(db_client: AsyncClient, clock: Clock) -> None:
    first = (await sign_in(db_client)).json()
    clock.now += timedelta(minutes=1)
    again = await sign_in(db_client, destination="+20 10 1234 5678", channel="phone")
    assert again.json()["id"] == first["id"]


async def test_an_email_is_kept_in_lower_case(db_client: AsyncClient, clock: Clock) -> None:
    user = (await sign_in(db_client, channel="email", destination="Mona@Example.com")).json()
    assert user["email"] == "mona@example.com"
    assert "phone" not in user


async def test_a_wrong_code_is_refused(db_client: AsyncClient, clock: Clock) -> None:
    response = await sign_in(db_client, code="111111")
    assert response.status_code == 400
    assert response.json() == {"code": "invalid_code"}
    assert (await db_client.get("/api/auth/session")).status_code == 401


async def test_five_wrong_codes_lock_the_code(db_client: AsyncClient, clock: Clock) -> None:
    await db_client.post("/api/auth/otp", json=PHONE)
    for _ in range(service.MAX_ATTEMPTS):
        wrong = await db_client.post("/api/auth/verify", json={**PHONE, "code": "111111"})
        assert wrong.json() == {"code": "invalid_code"}
    # Even the right one, now: guessing a million codes five at a time goes nowhere.
    right = await db_client.post("/api/auth/verify", json={**PHONE, "code": CODE})
    assert right.json() == {"code": "invalid_code"}


async def test_a_code_works_once(db_client: AsyncClient, clock: Clock) -> None:
    assert (await sign_in(db_client)).status_code == 200
    again = await db_client.post("/api/auth/verify", json={**PHONE, "code": CODE})
    assert again.json() == {"code": "invalid_code"}


async def test_a_code_expires(db_client: AsyncClient, clock: Clock) -> None:
    await db_client.post("/api/auth/otp", json=PHONE)
    clock.now += timedelta(minutes=5, seconds=1)
    late = await db_client.post("/api/auth/verify", json={**PHONE, "code": CODE})
    assert late.json() == {"code": "invalid_code"}


async def test_a_destination_gets_a_few_codes_and_a_wait_between_them(
    db_client: AsyncClient, clock: Clock, session: AsyncSession
) -> None:
    async def codes() -> int | None:
        return await session.scalar(select(func.count()).select_from(OtpCodeRecord))

    await db_client.post("/api/auth/otp", json=PHONE)
    # Again within 30 seconds: the same answer, but no new code (the last one still works).
    again = await db_client.post("/api/auth/otp", json=PHONE)
    assert again.json() == {"expiresIn": 300}
    assert await codes() == 1
    for _ in range(service.CODES_PER_HOUR + 2):
        clock.now += timedelta(seconds=31)
        await db_client.post("/api/auth/otp", json=PHONE)
    assert await codes() == service.CODES_PER_HOUR


@pytest.mark.parametrize(
    "body",
    [
        {**PHONE, "code": "48219"},
        {**PHONE, "code": "abcdef"},
        {**PHONE, "code": "٤٨٢١٩٣"},
        {"channel": "phone", "destination": "12345", "code": CODE},
    ],
)
async def test_a_malformed_verify_is_invalid_request(
    db_client: AsyncClient, clock: Clock, body: dict[str, str]
) -> None:
    response = await db_client.post("/api/auth/verify", json=body)
    assert response.status_code == 400
    assert response.json() == {"code": "invalid_request"}


async def test_no_session_is_signed_out(db_client: AsyncClient, clock: Clock) -> None:
    response = await db_client.get("/api/auth/session")
    assert response.status_code == 401
    assert response.json() == {"code": "signed_out"}


async def test_a_session_ends_after_thirty_days(db_client: AsyncClient, clock: Clock) -> None:
    await sign_in(db_client)
    clock.now += timedelta(days=30, seconds=1)
    assert (await db_client.get("/api/auth/session")).status_code == 401


async def test_signing_out_ends_the_session(
    db_client: AsyncClient, clock: Clock, session: AsyncSession
) -> None:
    await sign_in(db_client)
    response = await db_client.post("/api/auth/sign-out")
    assert response.status_code == 204
    assert response.content == b""
    assert f'{SESSION_COOKIE}=""' in response.headers["set-cookie"]
    assert (await db_client.get("/api/auth/session")).status_code == 401
    assert await session.scalar(select(func.count()).select_from(SessionRecord)) == 0


async def test_signing_out_without_a_session_is_fine(db_client: AsyncClient) -> None:
    assert (await db_client.post("/api/auth/sign-out")).status_code == 204


async def test_the_demo_takes_any_code_but_its_wrong_one(demo_client: AsyncClient) -> None:
    wrong = await demo_client.post("/api/auth/verify", json={**PHONE, "code": "000000"})
    assert wrong.json() == {"code": "invalid_code"}
    # No code was even requested: the demo takes any six digits.
    right = await demo_client.post("/api/auth/verify", json={**PHONE, "code": "135790"})
    assert right.status_code == 200
    assert (await demo_client.get("/api/auth/session")).status_code == 200
