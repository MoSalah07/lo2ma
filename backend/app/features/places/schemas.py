from app.core.api_model import ApiModel, GeoPoint, LocalizedText


class Place(ApiModel):
    """A place the location search knows: an office building, a business park or a district.

    placeSchema in packages/core.
    """

    id: str
    name: LocalizedText
    # The district and city under the name: «أبو رواش، الجيزة».
    area: LocalizedText
    point: GeoPoint


class PointLookup(ApiModel):
    """What is at a point on the map, and whether Lo2ma delivers there (pointLookupSchema)."""

    name: LocalizedText
    area: LocalizedText
    in_service_area: bool
