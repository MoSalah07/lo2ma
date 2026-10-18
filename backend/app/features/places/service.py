"""The location search: what to suggest, what matches a query, and what is at a point on the map."""

from geoalchemy2 import Geography
from sqlalchemy import ColumnElement, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.api_model import GeoPoint, LocalizedText
from app.domain.geo import is_in_service_area
from app.domain.search import search_words
from app.features.places.models import PlaceRecord
from app.features.places.schemas import Place, PointLookup

# A pin this close to a building is on that building (the mock's reverse search uses the same).
ON_A_PLACE_METERS = 150
SEARCH_LIMIT = 6


def _to_place(record: PlaceRecord) -> Place:
    return Place(
        id=record.id,
        name=LocalizedText(ar=record.name_ar, en=record.name_en),
        area=LocalizedText(ar=record.area_ar, en=record.area_en),
        point=GeoPoint(lat=record.lat, lng=record.lng),
    )


def _geography(point: GeoPoint) -> ColumnElement[Geography]:
    return cast(func.ST_SetSRID(func.ST_MakePoint(point.lng, point.lat), 4326), Geography)


async def suggested(session: AsyncSession) -> list[Place]:
    """The popular workplaces onboarding shows before anything is typed."""
    async with session.begin():
        records = await session.scalars(
            select(PlaceRecord)
            .where(PlaceRecord.suggested_rank.is_not(None))
            .order_by(PlaceRecord.suggested_rank)
        )
        return [_to_place(record) for record in records]


async def search(session: AsyncSession, query: str) -> list[Place]:
    """Buildings whose name or area holds every word of the query, in either language."""
    words = search_words(query)
    if not words:
        return []
    async with session.begin():
        records = await session.scalars(
            select(PlaceRecord)
            .where(
                PlaceRecord.kind == "building",
                # autoescape: a % or _ someone typed is a letter, not a wildcard.
                *(PlaceRecord.search_text.contains(word, autoescape=True) for word in words),
            )
            .order_by(PlaceRecord.suggested_rank.asc().nulls_last(), PlaceRecord.name_en)
            .limit(SEARCH_LIMIT)
        )
        return [_to_place(record) for record in records]


async def _nearest(
    session: AsyncSession, kind: str, point: GeoPoint, within: float | None = None
) -> PlaceRecord | None:
    here = _geography(point)
    statement = select(PlaceRecord).where(PlaceRecord.kind == kind)
    if within is not None:
        statement = statement.where(func.ST_DWithin(PlaceRecord.location, here, within))
    # <-> is the distance operator: it sorts by distance using the GiST index.
    return await session.scalar(statement.order_by(PlaceRecord.location.op("<->")(here)).limit(1))


async def look_up(session: AsyncSession, point: GeoPoint) -> PointLookup:
    """The building under a pin, or else the nearest district, and whether Lo2ma delivers there."""
    async with session.begin():
        named = await _nearest(
            session, "building", point, within=ON_A_PLACE_METERS
        ) or await _nearest(session, "district", point)
    if named is None:
        raise RuntimeError("The places table has no districts. Seed it: npm run db:seed")
    return PointLookup(
        name=LocalizedText(ar=named.name_ar, en=named.name_en),
        area=LocalizedText(ar=named.area_ar, en=named.area_en),
        in_service_area=is_in_service_area(point),
    )
