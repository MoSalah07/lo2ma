"""The preferences part of apps/web/src/mocks/handlers/handlers.test.ts, against the real API, plus
what only a real server has to get right: who the preferences belong to."""

from typing import Any

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.guests.cookie import GUEST_COOKIE
from app.features.guests.models import GuestRecord

pytestmark = pytest.mark.anyio

PREFS: dict[str, Any] = {
    "workplace": {
        "name": {"ar": "القرية الذكية · مبنى B2", "en": "Smart Village · Building B2"},
        "area": {"ar": "طريق مصر إسكندرية الصحراوي، الجيزة", "en": "Cairo–Alex Desert Road, Giza"},
        "point": {"lat": 30.0712, "lng": 31.0175},
        "details": "",
    },
    "breakTime": "13:30",
    "budget": 15000,
    "calories": {"mode": "any"},
    "exclusions": ["chicken"],
}


def with_changes(**changes: Any) -> dict[str, Any]:
    return {**PREFS, **changes}


async def test_needs_onboarding_first(db_client: AsyncClient) -> None:
    response = await db_client.get("/api/prefs")
    assert response.status_code == 404
    assert response.json() == {"code": "not_onboarded"}


async def test_saves_and_reads_back_for_the_same_browser(db_client: AsyncClient) -> None:
    saved = await db_client.put("/api/prefs", json=PREFS)
    assert saved.status_code == 200
    assert saved.json() == PREFS

    cookie = saved.headers["set-cookie"]
    assert cookie.startswith(f"{GUEST_COOKIE}=")
    for attribute in ("HttpOnly", "Secure", "SameSite=lax", "Path=/"):
        assert attribute in cookie

    again = await db_client.get("/api/prefs")
    assert again.status_code == 200
    assert again.json() == PREFS


async def test_a_second_save_updates_the_same_guest(
    db_client: AsyncClient, session: AsyncSession
) -> None:
    await db_client.put("/api/prefs", json=PREFS)
    second = await db_client.put("/api/prefs", json=with_changes(budget=20000))
    assert "set-cookie" not in second.headers
    assert (await db_client.get("/api/prefs")).json()["budget"] == 20000
    assert await session.scalar(select(func.count()).select_from(GuestRecord)) == 1


async def test_another_browser_sees_nothing(app: FastAPI, db_client: AsyncClient) -> None:
    await db_client.put("/api/prefs", json=PREFS)
    # Same app and database, no cookie.
    async with AsyncClient(transport=ASGITransport(app=app), base_url="https://test") as stranger:
        assert (await stranger.get("/api/prefs")).status_code == 404


async def test_an_unknown_cookie_is_no_one(db_client: AsyncClient) -> None:
    db_client.cookies.set(GUEST_COOKIE, "made-up")
    assert (await db_client.get("/api/prefs")).status_code == 404


async def test_refuses_a_workplace_lo2ma_does_not_deliver_to_yet(
    db_client: AsyncClient, session: AsyncSession
) -> None:
    new_capital = {**PREFS["workplace"], "point": {"lat": 30.011, "lng": 31.74}}
    response = await db_client.put("/api/prefs", json=with_changes(workplace=new_capital))
    assert response.status_code == 422
    assert response.json() == {"code": "outside_service_area"}
    # Refused before anything was written: no guest, no cookie.
    assert "set-cookie" not in response.headers
    assert await session.scalar(select(func.count()).select_from(GuestRecord)) == 0


async def test_stores_a_fit_mode_goal_and_never_a_body_profile(db_client: AsyncClient) -> None:
    calories = {"mode": "fit", "goal": "cut", "kcal": 780, "protein": 57}
    response = await db_client.put("/api/prefs", json=with_changes(calories=calories, weightKg=82))
    assert response.status_code == 200
    saved = (await db_client.get("/api/prefs")).json()
    assert saved["calories"] == calories
    assert "weightKg" not in saved


async def test_a_fit_goal_typed_by_hand_has_no_goal_key(db_client: AsyncClient) -> None:
    calories = {"mode": "fit", "kcal": 700, "protein": 40}
    await db_client.put("/api/prefs", json=with_changes(calories=calories))
    # zod's .optional(): the key is missing, never null.
    assert (await db_client.get("/api/prefs")).json()["calories"] == calories


async def test_keeps_a_calorie_limit(db_client: AsyncClient) -> None:
    for calories in ({"mode": "around", "kcal": 650}, {"mode": "under", "kcal": 600}):
        await db_client.put("/api/prefs", json=with_changes(calories=calories))
        assert (await db_client.get("/api/prefs")).json()["calories"] == calories


async def test_trims_the_notes_for_the_courier(db_client: AsyncClient) -> None:
    workplace = {**PREFS["workplace"], "details": "  مبنى B2، الدور التالت "}
    response = await db_client.put("/api/prefs", json=with_changes(workplace=workplace))
    assert response.json()["workplace"]["details"] == "مبنى B2، الدور التالت"


@pytest.mark.parametrize(
    "changes",
    [
        {"calories": {"mode": "fit", "kcal": 2400, "protein": 57}},  # beyond the stepper
        {"calories": {"mode": "fit", "kcal": 780}},  # no protein goal
        {"calories": {"mode": "around"}},  # no number
        {"calories": {"mode": "keto"}},
        {"budget": 9999},  # under the 100 EGP minimum order
        {"budget": "15000"},  # money is a number, never text
        {"budget": 150.5},
        {"breakTime": "1:30"},
        {"breakTime": "١٣:٣٠"},
        {"exclusions": ["pork"]},
        {"workplace": {**PREFS["workplace"], "details": "x" * 121}},
        {"workplace": {**PREFS["workplace"], "point": {"lat": 95, "lng": 31}}},
        {"workplace": {**PREFS["workplace"], "name": {"ar": "", "en": "Office"}}},
    ],
)
async def test_refuses_what_onboarding_would_never_send(
    db_client: AsyncClient, changes: dict[str, Any]
) -> None:
    response = await db_client.put("/api/prefs", json=with_changes(**changes))
    assert response.status_code == 400
    assert response.json() == {"code": "invalid_prefs"}


async def test_a_body_that_is_not_json_is_invalid_prefs(db_client: AsyncClient) -> None:
    response = await db_client.put(
        "/api/prefs", content=b"not json", headers={"content-type": "application/json"}
    )
    assert response.status_code == 400
    assert response.json() == {"code": "invalid_prefs"}
