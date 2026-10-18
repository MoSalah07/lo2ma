from typing import Annotated

from fastapi import APIRouter, Query

from app.core.api_model import GeoPoint
from app.core.db import SessionDep
from app.core.errors import invalid_input
from app.features.places import service
from app.features.places.schemas import Place, PointLookup

router = APIRouter(prefix="/places", tags=["places"])


@router.get("/suggested")
async def suggested_places(session: SessionDep) -> list[Place]:
    return await service.suggested(session)


@router.get("/search")
async def search_places(session: SessionDep, q: str = "") -> list[Place]:
    return await service.search(session, q)


@router.get("/reverse", openapi_extra=invalid_input("invalid_point"))
async def reverse_place(
    session: SessionDep,
    lat: Annotated[float, Query(ge=-90, le=90, allow_inf_nan=False)],
    lng: Annotated[float, Query(ge=-180, le=180, allow_inf_nan=False)],
) -> PointLookup:
    return await service.look_up(session, GeoPoint(lat=lat, lng=lng))
