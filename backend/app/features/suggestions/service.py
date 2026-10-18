"""Meals by their suggestion id: what's in them, and reports that a dish came different."""

from collections import defaultdict
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.api_model import LocalizedText
from app.core.errors import DomainError
from app.features.catalog.models import DishRecord, FoodRecord, RecipeLineRecord, RestaurantRecord
from app.features.catalog.schemas import calorie_source, dish_name, kcal_range
from app.features.guests.service import find_guest
from app.features.suggestions.ids import dish_ids_of
from app.features.suggestions.models import DishReportRecord
from app.features.suggestions.schemas import DishBreakdown, MealBreakdown, RecipeLine


class SuggestionNotFoundError(DomainError):
    status = 404
    code = "suggestion_not_found"


async def _meal_dishes(session: AsyncSession, suggestion_id: str) -> list[DishRecord]:
    """The dishes a suggestion's id names, in its order, while each is on the restaurant's menu."""
    named = dish_ids_of(suggestion_id)
    if named is None:
        raise SuggestionNotFoundError()
    restaurant_id, dish_ids = named
    found = await session.scalars(
        select(DishRecord)
        .join(RestaurantRecord, RestaurantRecord.id == DishRecord.restaurant_id)
        .where(
            DishRecord.id.in_(dish_ids),
            DishRecord.restaurant_id == restaurant_id,
            DishRecord.is_active,
            RestaurantRecord.is_active,
        )
    )
    by_id = {dish.id: dish for dish in found}
    if any(dish_id not in by_id for dish_id in dish_ids):
        raise SuggestionNotFoundError()
    return [by_id[dish_id] for dish_id in dish_ids]


async def meal_breakdown(session: AsyncSession, suggestion_id: str) -> MealBreakdown:
    """«حسبناها ازاي»: each dish, and the foods of the ones we estimated."""
    async with session.begin():
        dishes = await _meal_dishes(session, suggestion_id)
        rows = await session.execute(
            select(RecipeLineRecord, FoodRecord.name_ar, FoodRecord.name_en)
            .join(FoodRecord, FoodRecord.id == RecipeLineRecord.food_id)
            .where(RecipeLineRecord.dish_id.in_({dish.id for dish in dishes}))
            .order_by(RecipeLineRecord.dish_id, RecipeLineRecord.position)
        )
        lines: defaultdict[str, list[RecipeLine]] = defaultdict(list)
        for line, name_ar, name_en in rows:
            lines[line.dish_id].append(
                RecipeLine(
                    name=LocalizedText(ar=name_ar, en=name_en),
                    grams=line.grams,
                    kcal=line.kcal,
                    protein=line.protein,
                )
            )
    return MealBreakdown(
        dishes=[
            DishBreakdown(
                id=dish.id,
                name=dish_name(dish),
                quantity=1,
                kcal=dish.kcal,
                kcal_source=calorie_source(dish),
                kcal_range=kcal_range(dish),
                lines=lines[dish.id],
            )
            for dish in dishes
        ]
    )


async def report_meal(
    session: AsyncSession,
    suggestion_id: str,
    user_id: str | None,
    guest_token: str | None,
    now: datetime,
) -> None:
    """«الطبق جالك مختلف؟»: each estimated dish of the meal goes to review, once.

    A dish the restaurant published has nothing of ours to review.
    """
    async with session.begin():
        dishes = await _meal_dishes(session, suggestion_id)
        guest = await find_guest(session, guest_token)
        estimated = {dish.id for dish in dishes if dish.kcal_source == "ai"}
        session.add_all(
            DishReportRecord(
                dish_id=dish_id,
                user_id=UUID(user_id) if user_id else None,
                guest_id=guest.id if guest else None,
                created_at=now,
            )
            for dish_id in sorted(estimated)
        )
