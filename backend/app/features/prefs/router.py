from uuid import UUID

from fastapi import APIRouter, Response

from app.core.db import SessionDep
from app.core.errors import invalid_input
from app.features.auth.deps import MaybeUser
from app.features.guests.cookie import GuestToken, set_guest_cookie
from app.features.prefs import service
from app.features.prefs.schemas import UserPrefs

router = APIRouter(prefix="/prefs", tags=["prefs"])


@router.get("")
async def read_prefs(
    session: SessionDep, user: MaybeUser, guest_token: GuestToken = None
) -> UserPrefs:
    user_id = UUID(user.id) if user else None
    return await service.load_prefs(session, user_id, guest_token)


@router.put("", openapi_extra=invalid_input("invalid_prefs"))
async def update_prefs(
    prefs: UserPrefs,
    session: SessionDep,
    user: MaybeUser,
    response: Response,
    guest_token: GuestToken = None,
) -> UserPrefs:
    user_id = UUID(user.id) if user else None
    saved, new_token = await service.save_prefs(session, user_id, guest_token, prefs)
    if new_token:
        set_guest_cookie(response, new_token)
    return saved
