"""The menus: foods, restaurants and dishes from backend/seed/*.json.

The web app writes those files from its mock data (npm run export:seed -w @lo2ma/web), so the real
API offers the same meals as the mock. Seeding again updates the rows; a restaurant or dish the seed
no longer has is switched off, never deleted, because orders point at them.
"""

from collections.abc import Sequence
from pathlib import Path
from typing import Literal

from pydantic import TypeAdapter
from sqlalchemy import delete, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.api_model import ApiModel, GeoPoint, Ingredient, LocalizedText, Piasters
from app.features.catalog.models import DishRecord, FoodRecord, RecipeLineRecord, RestaurantRecord

SEED = Path(__file__).resolve().parents[3] / "seed"


class SeedFood(ApiModel):
    id: str
    name: LocalizedText
    kcal: float
    protein: float
    carbs: float
    fat: float
    spread: float


class SeedRestaurant(ApiModel):
    id: str
    name: LocalizedText
    point: GeoPoint
    eta_minutes: int
    delivery_fee: Piasters


class SeedRange(ApiModel):
    low: int
    high: int


class SeedMacros(ApiModel):
    protein: int
    carbs: int
    fat: int


class SeedLine(ApiModel):
    food: str
    grams: int
    kcal: int
    protein: int


class SeedDish(ApiModel):
    id: str
    restaurant_id: str
    position: int
    name: LocalizedText
    role: Literal["main", "side"]
    price: Piasters
    kcal: int
    kcal_source: Literal["restaurant", "ai"]
    kcal_range: SeedRange | None = None
    macros: SeedMacros
    contains: list[Ingredient]
    lines: list[SeedLine]


class Catalog(ApiModel):
    foods: list[SeedFood]
    restaurants: list[SeedRestaurant]
    dishes: list[SeedDish]


def load_catalog() -> Catalog:
    def read(name: str) -> bytes:
        return (SEED / name).read_bytes()

    return Catalog(
        foods=TypeAdapter(list[SeedFood]).validate_json(read("foods.json")),
        restaurants=TypeAdapter(list[SeedRestaurant]).validate_json(read("restaurants.json")),
        dishes=TypeAdapter(list[SeedDish]).validate_json(read("dishes.json")),
    )


async def _upsert(
    session: AsyncSession,
    table: type[FoodRecord | RestaurantRecord | DishRecord],
    rows: Sequence[dict[str, object]],
) -> None:
    statement = insert(table).values(list(rows))
    changes = {column: statement.excluded[column] for column in rows[0] if column != "id"}
    await session.execute(statement.on_conflict_do_update(index_elements=["id"], set_=changes))


async def seed_catalog(session: AsyncSession, catalog: Catalog) -> None:
    """Writes the menus, inside the caller's transaction."""
    await _upsert(
        session,
        FoodRecord,
        [
            {
                "id": food.id,
                "name_ar": food.name.ar,
                "name_en": food.name.en,
                "kcal": food.kcal,
                "protein": food.protein,
                "carbs": food.carbs,
                "fat": food.fat,
                "spread": food.spread,
            }
            for food in catalog.foods
        ],
    )
    await _upsert(
        session,
        RestaurantRecord,
        [
            {
                "id": restaurant.id,
                "name_ar": restaurant.name.ar,
                "name_en": restaurant.name.en,
                "lat": restaurant.point.lat,
                "lng": restaurant.point.lng,
                "eta_minutes": restaurant.eta_minutes,
                "delivery_fee": restaurant.delivery_fee,
                "is_active": True,
            }
            for restaurant in catalog.restaurants
        ],
    )
    await _upsert(
        session,
        DishRecord,
        [
            {
                "id": dish.id,
                "restaurant_id": dish.restaurant_id,
                "position": dish.position,
                "name_ar": dish.name.ar,
                "name_en": dish.name.en,
                "role": dish.role,
                "price": dish.price,
                "kcal": dish.kcal,
                "kcal_source": dish.kcal_source,
                "kcal_low": dish.kcal_range.low if dish.kcal_range else None,
                "kcal_high": dish.kcal_range.high if dish.kcal_range else None,
                "protein": dish.macros.protein,
                "carbs": dish.macros.carbs,
                "fat": dish.macros.fat,
                "contains": list(dish.contains),
                "is_active": True,
            }
            for dish in catalog.dishes
        ],
    )
    restaurant_ids = [restaurant.id for restaurant in catalog.restaurants]
    dish_ids = [dish.id for dish in catalog.dishes]
    await session.execute(
        update(RestaurantRecord)
        .where(RestaurantRecord.id.not_in(restaurant_ids))
        .values(is_active=False)
    )
    await session.execute(
        update(DishRecord).where(DishRecord.id.not_in(dish_ids)).values(is_active=False)
    )
    # The lines are the seed's own: written again whole.
    await session.execute(delete(RecipeLineRecord).where(RecipeLineRecord.dish_id.in_(dish_ids)))
    lines = [
        {
            "dish_id": dish.id,
            "position": position,
            "food_id": line.food,
            "grams": line.grams,
            "kcal": line.kcal,
            "protein": line.protein,
        }
        for dish in catalog.dishes
        for position, line in enumerate(dish.lines, start=1)
    ]
    if lines:
        await session.execute(insert(RecipeLineRecord).values(lines))
