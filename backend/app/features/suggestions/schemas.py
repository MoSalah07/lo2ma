from typing import Annotated

from pydantic import Field
from pydantic.json_schema import SkipJsonSchema

from app.core.api_model import ApiModel, Kcal, LocalizedText, NonNegativeInt, PositiveInt, omitted
from app.features.catalog.schemas import CalorieSource, KcalRange


class RecipeLine(ApiModel):
    """One food of an estimated dish, as «حسبناها ازاي» lists it (recipeLineSchema)."""

    name: LocalizedText
    grams: PositiveInt
    kcal: NonNegativeInt
    protein: NonNegativeInt


class DishBreakdown(ApiModel):
    """A dish of a meal and how its calories were worked out (dishBreakdownSchema).

    A dish the restaurant published has no lines: its number is the restaurant's.
    """

    id: str
    name: LocalizedText
    quantity: PositiveInt
    kcal: Kcal
    kcal_source: CalorieSource
    kcal_range: KcalRange | SkipJsonSchema[None] = omitted()
    lines: list[RecipeLine]


class MealBreakdown(ApiModel):
    """GET /suggestions/:id/nutrition (mealBreakdownSchema)."""

    dishes: Annotated[list[DishBreakdown], Field(min_length=1)]
