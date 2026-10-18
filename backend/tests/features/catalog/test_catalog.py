"""What the catalog offers a workplace: the dishes near it, without what someone avoids."""

import pytest
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.geo import Point
from app.features.catalog.models import DishRecord, RecipeLineRecord, RestaurantRecord
from app.features.catalog.queries import nearby_dishes
from app.features.catalog.seed import load_catalog, seed_catalog

pytestmark = pytest.mark.anyio

SMART_VILLAGE_B2 = Point(30.0712, 31.0175)
ZAMALEK = Point(30.0618, 31.2201)


async def test_offers_every_restaurant_around_the_smart_village(
    session: AsyncSession, catalog: None
) -> None:
    dishes = await nearby_dishes(session, SMART_VILLAGE_B2, [])
    assert len({nearby.restaurant.id for nearby in dishes}) == 30
    assert len(dishes) == 119


async def test_measures_from_the_workplace_and_lists_the_nearest_first(
    session: AsyncSession, catalog: None
) -> None:
    dishes = await nearby_dishes(session, SMART_VILLAGE_B2, [])
    distances = [nearby.distance_meters for nearby in dishes]
    assert distances == sorted(distances)
    # Salatat Khadra is 0.8 km from the village's middle in the seed; building B2 is a few hundred
    # meters off that middle.
    salads = next(nearby for nearby in dishes if nearby.restaurant.id == "r03")
    assert 500 < salads.distance_meters < 1100


async def test_offers_nothing_beyond_the_delivery_radius(
    session: AsyncSession, catalog: None
) -> None:
    assert await nearby_dishes(session, ZAMALEK, []) == []


async def test_leaves_out_every_dish_with_an_ingredient_to_avoid(
    session: AsyncSession, catalog: None
) -> None:
    dishes = await nearby_dishes(session, SMART_VILLAGE_B2, ["chicken", "dairy"])
    assert dishes
    for nearby in dishes:
        assert "chicken" not in nearby.dish.contains
        assert "dairy" not in nearby.dish.contains


async def test_leaves_out_what_is_switched_off(session: AsyncSession, catalog: None) -> None:
    await session.execute(
        update(RestaurantRecord).where(RestaurantRecord.id == "r03").values(is_active=False)
    )
    await session.execute(
        update(DishRecord).where(DishRecord.id == "r01-m1").values(is_active=False)
    )
    ids = {nearby.dish.id for nearby in await nearby_dishes(session, SMART_VILLAGE_B2, [])}
    assert "r01-m1" not in ids
    assert not any(dish_id.startswith("r03-") for dish_id in ids)


async def test_seeding_again_changes_nothing(session: AsyncSession, catalog: None) -> None:
    again = load_catalog()
    await seed_catalog(session, again)
    lines = await session.scalar(select(func.count()).select_from(RecipeLineRecord))
    assert lines == sum(len(dish.lines) for dish in again.dishes)


async def test_only_estimates_have_a_range(session: AsyncSession, catalog: None) -> None:
    published = await session.scalar(
        select(DishRecord).where(DishRecord.kcal_source == "restaurant")
    )
    assert published is not None
    published.kcal_low, published.kcal_high = 500, 600
    with pytest.raises(IntegrityError, match="ck_dishes_kcal_range"):
        await session.flush()
