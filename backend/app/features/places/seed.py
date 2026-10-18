"""The places the location search knows, from backend/seed/places.json.

The web app writes that file from its mock data (npm run export:seed -w @lo2ma/web), so the real
API knows the same places as the mock.
"""

from collections.abc import Sequence
from pathlib import Path
from typing import Literal

from pydantic import TypeAdapter
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.api_model import ApiModel, GeoPoint, LocalizedText
from app.domain.search import fold_for_search
from app.features.places.models import PlaceRecord

SEED_FILE = Path(__file__).resolve().parents[3] / "seed" / "places.json"


class SeedPlace(ApiModel):
    id: str
    kind: Literal["building", "district"]
    name: LocalizedText
    area: LocalizedText
    point: GeoPoint
    suggested_rank: int | None = None


def load_places() -> list[SeedPlace]:
    return TypeAdapter(list[SeedPlace]).validate_json(SEED_FILE.read_bytes())


async def seed_places(session: AsyncSession, places: Sequence[SeedPlace]) -> None:
    """Writes the places, updating the ones already there, and drops any the seed no longer has."""
    rows = [
        {
            "id": place.id,
            "kind": place.kind,
            "name_ar": place.name.ar,
            "name_en": place.name.en,
            "area_ar": place.area.ar,
            "area_en": place.area.en,
            "lat": place.point.lat,
            "lng": place.point.lng,
            "search_text": fold_for_search(
                " ".join([place.name.ar, place.name.en, place.area.ar, place.area.en])
            ),
            "suggested_rank": place.suggested_rank,
        }
        for place in places
    ]
    upsert = insert(PlaceRecord).values(rows)
    updated = {column: upsert.excluded[column] for column in rows[0] if column != "id"}
    await session.execute(upsert.on_conflict_do_update(index_elements=["id"], set_=updated))
    await session.execute(
        delete(PlaceRecord).where(PlaceRecord.id.not_in([place.id for place in places]))
    )
