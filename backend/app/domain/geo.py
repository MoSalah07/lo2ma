"""Distances on the earth's surface, and where Lo2ma delivers.

The same formula as packages/core/src/geo.ts; tests/domain checks both give the same answers.
"""

import math
from typing import NamedTuple, Protocol

from app.domain.rules import (
    SERVICE_AREA_CENTER_LAT,
    SERVICE_AREA_CENTER_LNG,
    SERVICE_AREA_RADIUS_METERS,
)

EARTH_RADIUS_METERS = 6_371_000


class LatLng(Protocol):
    """Anything with a latitude and a longitude in degrees: a Point, or a point the API received."""

    @property
    def lat(self) -> float: ...

    @property
    def lng(self) -> float: ...


class Point(NamedTuple):
    """A point in degrees (WGS 84, what GPS and every map use)."""

    lat: float
    lng: float


SERVICE_AREA_CENTER = Point(SERVICE_AREA_CENTER_LAT, SERVICE_AREA_CENTER_LNG)


def _radians(degrees: float) -> float:
    # Degrees times pi over 180, as the TypeScript does, not math.radians: both round the same way.
    return degrees * math.pi / 180


def distance_meters(a: LatLng, b: LatLng) -> float:
    """The distance between two points along the earth's surface (haversine), in meters."""
    d_lat = _radians(b.lat - a.lat)
    d_lng = _radians(b.lng - a.lng)
    h = (
        math.sin(d_lat / 2) ** 2
        + math.cos(_radians(a.lat)) * math.cos(_radians(b.lat)) * math.sin(d_lng / 2) ** 2
    )
    return 2 * EARTH_RADIUS_METERS * math.asin(min(1.0, math.sqrt(h)))


def is_in_service_area(point: LatLng) -> bool:
    """Whether Lo2ma delivers to a point."""
    return distance_meters(point, SERVICE_AREA_CENTER) <= SERVICE_AREA_RADIUS_METERS
