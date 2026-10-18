from fastapi import APIRouter, Response

from app.core.db import SessionDep
from app.core.errors import invalid_input
from app.core.now import Now
from app.core.settings import SettingsDep
from app.features.auth import service
from app.features.auth.cookie import SessionToken, clear_session_cookie, set_session_cookie
from app.features.auth.deps import MaybeUser
from app.features.auth.schemas import OtpRequest, OtpSent, OtpVerify, SessionUser
from app.features.guests.cookie import GuestToken

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/otp", openapi_extra=invalid_input("invalid_destination"))
async def request_code(
    body: OtpRequest, session: SessionDep, settings: SettingsDep, now: Now
) -> OtpSent:
    seconds = await service.request_code(session, settings, body.channel, body.destination, now)
    return OtpSent(expires_in=seconds)


@router.post("/verify")
async def verify_code(
    body: OtpVerify,
    session: SessionDep,
    settings: SettingsDep,
    now: Now,
    response: Response,
    guest_token: GuestToken = None,
) -> SessionUser:
    attempt = (body.channel, body.destination, body.code)
    user, token = await service.verify_code(session, settings, attempt, guest_token, now)
    set_session_cookie(response, token)
    return user


@router.get("/session")
async def read_session(user: MaybeUser) -> SessionUser:
    if user is None:
        raise service.SignedOutError()
    return user


@router.post("/sign-out", status_code=204)
async def sign_out(session: SessionDep, response: Response, token: SessionToken = None) -> None:
    await service.sign_out(session, token)
    clear_session_cookie(response)
