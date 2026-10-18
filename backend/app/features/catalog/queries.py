"""What the catalog can offer a workplace. These run inside the caller's transaction (suggestions,
the weekly plan, the agent's tools)."""

from collections.abc import Sequence
from typing import NamedTuple

from sqlalchemy import Text, cast, func, select
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.geography import as_geography
from app.domain.geo import LatLng
from app.domain.rules import DELIVERY_RADIUS_METERS
from app.features.catalog.models import DishRecord, RestaurantRecord


class NearbyDish(NamedTuple):
    dish: DishRecord
    restaurant: RestaurantRecord
    # From the workplace, along the earth's surface.
    distance_meters: float


async def nearby_dishes(
    session: AsyncSession, workplace: LatLng, exclusions: Sequence[str]
) -> list[NearbyDish]:
    """The dishes Lo2ma can bring to a workplace.

    On the menu, from an open restaurant within the delivery radius, and with none of the
    ingredients to avoid. The nearest restaurant first, then each menu in its own order.
    """
    here = as_geography(workplace)
    distance = func.ST_Distance(RestaurantRecord.location, here)
    statement = (
        select(DishRecord, RestaurantRecord, distance)
        .join(DishRecord.restaurant)
        .where(
            DishRecord.is_active,
            RestaurantRecord.is_active,
            # Uses the GiST index; ST_Distance(...) < r alone would measure every restaurant.
            func.ST_DWithin(RestaurantRecord.location, here, DELIVERY_RADIUS_METERS),
            # NOT (contains && ARRAY[...]): uses the GIN index on contains.
            ~DishRecord.contains.overlap(cast(list(exclusions), ARRAY(Text))),
        )
        .order_by(distance, RestaurantRecord.id, DishRecord.position)
    )
    rows = await session.execute(statement)
    return [NearbyDish(dish, restaurant, meters) for dish, restaurant, meters in rows]
