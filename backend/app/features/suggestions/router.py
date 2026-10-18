from fastapi import APIRouter, Response

from app.core.db import SessionDep
from app.core.now import Now
from app.features.auth.deps import MaybeUser
from app.features.guests.cookie import GuestToken
from app.features.suggestions import service
from app.features.suggestions.schemas import MealBreakdown

router = APIRouter(prefix="/suggestions", tags=["suggestions"])


@router.get("/{suggestion_id}/nutrition")
async def read_meal_breakdown(suggestion_id: str, session: SessionDep) -> MealBreakdown:
    return await service.meal_breakdown(session, suggestion_id)


@router.post("/{suggestion_id}/nutrition/report", status_code=202, response_class=Response)
async def report_meal_nutrition(
    suggestion_id: str,
    session: SessionDep,
    now: Now,
    user: MaybeUser,
    guest_token: GuestToken = None,
) -> Response:
    """Taken for review; nothing comes back."""
    user_id = user.id if user else None
    await service.report_meal(session, suggestion_id, user_id, guest_token, now)
    return Response(status_code=202)
