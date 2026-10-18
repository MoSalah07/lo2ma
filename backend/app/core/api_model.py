"""The base of every model the API sends or receives, and the shapes the features share.

Each model mirrors a zod schema in packages/core/src/schemas, under the same name.
"""

from typing import Annotated, Any, Literal

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    """camelCase in JSON, snake_case in Python."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        # model_dump() writes camelCase too, as in the SSE events.
        serialize_by_alias=True,
        # Unknown keys are dropped, as zod does. The apps may send more than a route reads: the
        # contract's fit-mode test sends weightKg to PUT /prefs and expects 200.
        extra="ignore",
    )


def _is_none(value: object) -> bool:
    return value is None


def omitted() -> Any:
    """A field that is left out of the JSON when it's None, for a zod `.optional()`.

    Pydantic would otherwise send `null`, which `.optional()` refuses. Type the field
    `X | SkipJsonSchema[None]`, so the OpenAPI schema says "may be missing", not "may be null".
    """
    return Field(default=None, exclude_if=_is_none)


# Money is a whole number of piasters, and strict: "150" or true never become an amount.
Piasters = Annotated[int, Field(strict=True, ge=0)]
# A whole, positive number of kilocalories.
Kcal = Annotated[int, Field(strict=True, gt=0)]
# "13:30" on Cairo's clock (time24Schema). [0-9], not \d, which matches other scripts' digits.
Time24 = Annotated[str, Field(pattern=r"^([01][0-9]|2[0-3]):([0-5][0-9])$")]
# What people may avoid; a dish lists every one it contains (ingredientSchema).
Ingredient = Literal["chicken", "beef", "fish", "nuts", "dairy"]


class LocalizedText(ApiModel):
    """Text in both languages, such as a place's name (localizedTextSchema)."""

    ar: Annotated[str, Field(min_length=1)]
    en: Annotated[str, Field(min_length=1)]


class GeoPoint(ApiModel):
    """A point in degrees, WGS 84 (geoPointSchema)."""

    lat: Annotated[float, Field(ge=-90, le=90, allow_inf_nan=False)]
    lng: Annotated[float, Field(ge=-180, le=180, allow_inf_nan=False)]
