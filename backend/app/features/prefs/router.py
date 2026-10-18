from fastapi import APIRouter, Response

from app.core.db import SessionDep
from app.core.errors import invalid_input
from app.features.guests.cookie import GuestToken, set_guest_cookie
from app.features.prefs import service
from app.features.prefs.schemas import UserPrefs

router = APIRouter(prefix="/prefs", tags=["prefs"])


@router.get("")
async def read_prefs(session: SessionDep, guest_token: GuestToken = None) -> UserPrefs:
    return await service.load_prefs(session, guest_token)


@router.put("", openapi_extra=invalid_input("invalid_prefs"))
async def update_prefs(
    prefs: UserPrefs, session: SessionDep, response: Response, guest_token: GuestToken = None
) -> UserPrefs:
    saved, new_token = await service.save_prefs(session, guest_token, prefs)
    if new_token:
        set_guest_cookie(response, new_token)
    return saved
