from typing import Annotated, Literal

from pydantic import Field, StringConstraints
from pydantic.json_schema import SkipJsonSchema

from app.core.api_model import (
    ApiModel,
    GeoPoint,
    Ingredient,
    Kcal,
    LocalizedText,
    Piasters,
    Time24,
    omitted,
)
from app.domain.rules import (
    FIT_LUNCH_LIMITS_KCAL_MAX,
    FIT_LUNCH_LIMITS_KCAL_MIN,
    FIT_LUNCH_LIMITS_PROTEIN_MAX,
    FIT_LUNCH_LIMITS_PROTEIN_MIN,
    MIN_ORDER,
    WORKPLACE_DETAILS_MAX,
)

# «تنشيف», «ثبات», «تضخيم» (fitGoalSchema).
FitGoal = Literal["cut", "keep", "bulk"]


class AnyCalories(ApiModel):
    mode: Literal["any"]


class AroundCalories(ApiModel):
    mode: Literal["around"]
    kcal: Kcal


class UnderCalories(ApiModel):
    mode: Literal["under"]
    kcal: Kcal


class FitCalories(ApiModel):
    """«وضع الفورمة»: a lunch goal in calories and protein, within the steppers' limits."""

    mode: Literal["fit"]
    # Missing when the user typed the numbers instead of using the calculator.
    goal: FitGoal | SkipJsonSchema[None] = omitted()
    kcal: Annotated[
        int, Field(strict=True, ge=FIT_LUNCH_LIMITS_KCAL_MIN, le=FIT_LUNCH_LIMITS_KCAL_MAX)
    ]
    protein: Annotated[
        int, Field(strict=True, ge=FIT_LUNCH_LIMITS_PROTEIN_MIN, le=FIT_LUNCH_LIMITS_PROTEIN_MAX)
    ]


# caloriePrefSchema: `mode` picks the shape.
CaloriePref = Annotated[
    AnyCalories | AroundCalories | UnderCalories | FitCalories, Field(discriminator="mode")
]


class Workplace(ApiModel):
    """Where lunch goes: a point on the map, its name in both languages, and the courier's notes."""

    name: LocalizedText
    # The district and city: «أبو رواش، الجيزة».
    area: LocalizedText
    point: GeoPoint
    # «مبنى B2، الدور التالت»: the user's own words, trimmed.
    details: Annotated[
        str, StringConstraints(strip_whitespace=True, max_length=WORKPLACE_DETAILS_MAX)
    ]


class UserPrefs(ApiModel):
    """What onboarding collects and «حسابي» edits (userPrefsSchema)."""

    workplace: Workplace
    break_time: Time24
    budget: Annotated[Piasters, Field(ge=MIN_ORDER)]
    calories: CaloriePref
    exclusions: list[Ingredient]
