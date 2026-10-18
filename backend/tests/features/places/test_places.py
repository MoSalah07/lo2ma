"""The places part of apps/web/src/mocks/handlers/handlers.test.ts, against the real API."""

from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.places.models import PlaceRecord
from app.features.places.seed import load_places, seed_places

pytestmark = pytest.mark.anyio


@pytest.fixture
async def seeded(session: AsyncSession) -> None:
    await seed_places(session, load_places())


async def get_json(client: AsyncClient, path: str) -> Any:
    response = await client.get(path)
    assert response.status_code == 200
    return response.json()


async def test_suggests_popular_workplaces_smart_village_first(
    db_client: AsyncClient, seeded: None
) -> None:
    suggested = await get_json(db_client, "/api/places/suggested")
    assert len(suggested) > 3
    assert "Smart Village" in suggested[0]["name"]["en"]
    assert set(suggested[0]) == {"id", "name", "area", "point"}


async def test_finds_places_the_way_people_type_them(db_client: AsyncClient, seeded: None) -> None:
    async def search(query: str) -> list[str]:
        places = await get_json(db_client, f"/api/places/search?q={query}")
        return [place["name"]["en"] for place in places]

    # No hamza, ه for ة, and the building in Latin letters: still B7.
    assert await search("القريه الذكيه b7") == ["Smart Village · Building B7"]
    assert len(await search("smart village")) == 3
    assert await search("  ") == []
    assert await search("Alexandria") == []


async def test_a_wildcard_is_just_a_letter(db_client: AsyncClient, seeded: None) -> None:
    assert await get_json(db_client, "/api/places/search?q=%25") == []
    assert await get_json(db_client, "/api/places/search?q=_") == []


async def test_names_what_is_under_a_pin_and_whether_lo2ma_delivers(
    db_client: AsyncClient, seeded: None
) -> None:
    async def at(lat: float, lng: float) -> dict[str, Any]:
        return await get_json(db_client, f"/api/places/reverse?lat={lat}&lng={lng}")

    on_b2 = await at(30.07125, 31.01752)
    assert on_b2["name"]["en"] == "Smart Village · Building B2"
    assert on_b2["inServiceArea"] is True
    # Off any building: the nearest district.
    assert (await at(30.065, 31.225))["name"]["en"] == "Zamalek"
    assert (await at(30.011, 31.74))["inServiceArea"] is False


@pytest.mark.parametrize(
    "query", ["lat=95&lng=31", "lat=30", "lng=31", "lat=north&lng=31", "lat=nan&lng=31"]
)
async def test_refuses_a_point_that_is_not_one(db_client: AsyncClient, query: str) -> None:
    response = await db_client.get(f"/api/places/reverse?{query}")
    assert response.status_code == 400
    assert response.json() == {"code": "invalid_point"}


async def test_seeding_again_updates_in_place(session: AsyncSession) -> None:
    places = load_places()
    await seed_places(session, places)
    await seed_places(session, places[1:])
    count = await session.scalar(select(func.count()).select_from(PlaceRecord))
    assert count == len(places) - 1
