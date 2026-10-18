"""Points as PostGIS sees them."""

from geoalchemy2 import Geography
from sqlalchemy import ColumnElement, cast, func

from app.domain.geo import LatLng


def as_geography(point: LatLng) -> ColumnElement[Geography]:
    """The one place a point becomes PostGIS: x is the longitude, then y the latitude."""
    return cast(func.ST_SetSRID(func.ST_MakePoint(point.lng, point.lat), 4326), Geography)
