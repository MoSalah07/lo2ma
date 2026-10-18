import math

import pytest

from app.domain.geo import GeoPoint, distance_meters, is_in_service_area
from tests.vectors import load

VECTORS = load("geo")


@pytest.mark.parametrize(
    ("a_lat", "a_lng", "b_lat", "b_lng", "expected"), VECTORS["distance_meters"]
)
def test_measures_like_the_apps(
    a_lat: float, a_lng: float, b_lat: float, b_lng: float, expected: float
) -> None:
    distance = distance_meters(GeoPoint(a_lat, a_lng), GeoPoint(b_lat, b_lng))
    # JavaScript and C may round sin and cos one bit apart; a micrometer is the same answer.
    assert math.isclose(distance, expected, rel_tol=1e-12, abs_tol=1e-6)


@pytest.mark.parametrize(("lat", "lng", "expected"), VECTORS["is_in_service_area"])
def test_delivers_where_the_apps_say_it_does(lat: float, lng: float, expected: bool) -> None:
    assert is_in_service_area(GeoPoint(lat, lng)) is expected
