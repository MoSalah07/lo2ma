"""Preferences once there is an account: onboarding done as a guest follows the user in, and each
account sees only its own."""

from collections.abc import Callable
from typing import Any

import pytest
from fastapi import FastAPI
from httpx import AsyncClient

from app.features.auth import service
from tests.clock import Clock

pytestmark = pytest.mark.anyio

PREFS: dict[str, Any] = {
    "workplace": {
        "name": {"ar": "الزمالك · شارع 26 يوليو", "en": "Zamalek · 26th of July Street"},
        "area": {"ar": "الزمالك، القاهرة", "en": "Zamalek, Cairo"},
        "point": {"lat": 30.0618, "lng": 31.2201},
        "details": "",
    },
    "breakTime": "13:00",
    "budget": 20000,
    "calories": {"mode": "under", "kcal": 700},
    "exclusions": [],
}


@pytest.fixture(autouse=True)
def known_code(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(service, "new_code", lambda: "482193")


async def sign_in(client: AsyncClient, destination: str) -> None:
    target = {"channel": "phone", "destination": destination}
    await client.post("/api/auth/otp", json=target)
    response = await client.post("/api/auth/verify", json={**target, "code": "482193"})
    assert response.status_code == 200


async def test_onboarding_as_a_guest_follows_the_user_in(
    db_client: AsyncClient, clock: Clock
) -> None:
    await db_client.put("/api/prefs", json=PREFS)
    await sign_in(db_client, "01012345678")
    assert (await db_client.get("/api/prefs")).json() == PREFS


async def test_a_signed_in_save_is_the_accounts(db_client: AsyncClient, clock: Clock) -> None:
    await db_client.put("/api/prefs", json=PREFS)
    await sign_in(db_client, "01012345678")
    await db_client.put("/api/prefs", json={**PREFS, "budget": 30000})
    assert (await db_client.get("/api/prefs")).json()["budget"] == 30000
    # Signed out, this browser is the guest again, with what it saved as a guest.
    await db_client.post("/api/auth/sign-out")
    assert (await db_client.get("/api/prefs")).json()["budget"] == 20000


async def test_an_account_sees_only_its_own(
    app: FastAPI, client_of: Callable[[FastAPI], AsyncClient], clock: Clock
) -> None:
    async with client_of(app) as mona, client_of(app) as karim:
        await sign_in(mona, "01012345678")
        await mona.put("/api/prefs", json=PREFS)
        await sign_in(karim, "01112345678")
        response = await karim.get("/api/prefs")
        assert response.status_code == 404
        assert response.json() == {"code": "not_onboarded"}
