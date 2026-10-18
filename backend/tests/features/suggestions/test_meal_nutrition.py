"""The «meal nutrition» part of apps/web/src/mocks/handlers/handlers.test.ts against the real API,
and what the mock can't show: dishes switched off, made-up ids, and reports kept per dish."""

from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.catalog.models import DishRecord
from app.features.suggestions.models import DishReportRecord

pytestmark = pytest.mark.anyio

# Beit El Koshari's dishes are our estimates (r01); Salatat Khadra publishes its numbers (r03).
ESTIMATED = "r01.m1.m4"
PUBLISHED = "r03.m1"


async def breakdown(client: AsyncClient, suggestion_id: str) -> Any:
    return await client.get(f"/api/suggestions/{suggestion_id}/nutrition")


async def report(client: AsyncClient, suggestion_id: str) -> Any:
    return await client.post(f"/api/suggestions/{suggestion_id}/nutrition/report")


async def reports(session: AsyncSession) -> list[DishReportRecord]:
    return list(await session.scalars(select(DishReportRecord).order_by(DishReportRecord.dish_id)))


async def test_breaks_an_estimated_meal_down_into_the_foods_of_each_dish(
    db_client: AsyncClient, catalog: None
) -> None:
    response = await breakdown(db_client, ESTIMATED)
    assert response.status_code == 200
    dishes = response.json()["dishes"]
    assert [dish["id"] for dish in dishes] == ["r01-m1", "r01-m4"]
    for dish in dishes:
        assert dish["kcalSource"] == "ai"
        assert dish["kcalRange"]["low"] <= dish["kcal"] <= dish["kcalRange"]["high"]
        assert dish["lines"]
        lines_kcal = sum(line["kcal"] for line in dish["lines"])
        assert abs(lines_kcal - dish["kcal"]) <= 5 * len(dish["lines"])
        assert set(dish["lines"][0]) == {"name", "grams", "kcal", "protein"}


async def test_keeps_a_dish_the_restaurant_published_whole_with_no_range(
    db_client: AsyncClient, catalog: None
) -> None:
    (dish,) = (await breakdown(db_client, PUBLISHED)).json()["dishes"]
    assert dish["kcalSource"] == "restaurant"
    assert dish["lines"] == []
    assert "kcalRange" not in dish


async def test_lists_the_dishes_in_the_order_the_id_names_them(
    db_client: AsyncClient, catalog: None
) -> None:
    dishes = (await breakdown(db_client, "r01.m4.m1")).json()["dishes"]
    assert [dish["id"] for dish in dishes] == ["r01-m4", "r01-m1"]


@pytest.mark.parametrize(
    "suggestion_id", ["r99.m1", "r01", "r01.", ".m1", "r01.m99", "r01.m1.m99", "r01" + ".m1" * 11]
)
async def test_answers_404_for_a_meal_that_does_not_exist(
    db_client: AsyncClient, catalog: None, suggestion_id: str
) -> None:
    for response in (
        await breakdown(db_client, suggestion_id),
        await report(db_client, suggestion_id),
    ):
        assert response.status_code == 404
        assert response.json() == {"code": "suggestion_not_found"}


async def test_a_dish_switched_off_is_no_longer_a_meal(
    db_client: AsyncClient, catalog: None, session: AsyncSession
) -> None:
    await session.execute(
        update(DishRecord).where(DishRecord.id == "r01-m4").values(is_active=False)
    )
    assert (await breakdown(db_client, ESTIMATED)).status_code == 404
    assert (await breakdown(db_client, "r01.m1")).status_code == 200


async def test_takes_a_report_on_each_estimated_dish_once(
    db_client: AsyncClient, catalog: None, session: AsyncSession
) -> None:
    response = await report(db_client, "r01.m1.m4.m1")
    assert response.status_code == 202
    assert response.content == b""
    assert [row.dish_id for row in await reports(session)] == ["r01-m1", "r01-m4"]


async def test_a_published_dish_has_nothing_to_review(
    db_client: AsyncClient, catalog: None, session: AsyncSession
) -> None:
    assert (await report(db_client, PUBLISHED)).status_code == 202
    assert await reports(session) == []


async def test_remembers_who_reported(
    demo_client: AsyncClient, catalog: None, session: AsyncSession
) -> None:
    customer = {"channel": "phone", "destination": "01012345678", "code": "135790"}
    user = (await demo_client.post("/api/auth/verify", json=customer)).json()
    await report(demo_client, "r01.m1")
    (row,) = await reports(session)
    assert str(row.user_id) == user["id"]
    assert row.guest_id is None
