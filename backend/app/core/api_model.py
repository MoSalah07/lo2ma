"""The base of every model the API sends or receives, and the shapes the features share.

Each model mirrors a zod schema in packages/core/src/schemas, under the same name.
"""

from typing import Annotated

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


class LocalizedText(ApiModel):
    """Text in both languages, such as a place's name (localizedTextSchema)."""

    ar: Annotated[str, Field(min_length=1)]
    en: Annotated[str, Field(min_length=1)]


class GeoPoint(ApiModel):
    """A point in degrees, WGS 84 (geoPointSchema)."""

    lat: Annotated[float, Field(ge=-90, le=90, allow_inf_nan=False)]
    lng: Annotated[float, Field(ge=-180, le=180, allow_inf_nan=False)]
