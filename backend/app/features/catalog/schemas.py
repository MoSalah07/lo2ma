"""The menu's shapes the API sends: shared by the meal, its breakdown and, later, the order."""

from typing import Literal

from app.core.api_model import ApiModel, Kcal, LocalizedText
from app.features.catalog.models import DishRecord

# Where a calorie number comes from (calorieSourceSchema). Every number shown carries its source.
CalorieSource = Literal["restaurant", "ai"]


class KcalRange(ApiModel):
    """The fewest and the most calories an estimate allows (kcalRangeSchema)."""

    low: Kcal
    high: Kcal


def dish_name(dish: DishRecord) -> LocalizedText:
    return LocalizedText(ar=dish.name_ar, en=dish.name_en)


def calorie_source(dish: DishRecord) -> CalorieSource:
    # The table's CHECK allows only these two.
    return "ai" if dish.kcal_source == "ai" else "restaurant"


def kcal_range(dish: DishRecord) -> KcalRange | None:
    """An estimate's range; None for a number the restaurant published."""
    if dish.kcal_low is None or dish.kcal_high is None:
        return None
    return KcalRange(low=dish.kcal_low, high=dish.kcal_high)
