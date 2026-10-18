from fastapi import APIRouter, Response

from app.core.db import SessionDep
from app.core.errors import SignedOutError, invalid_input
from app.core.now import Now
from app.core.settings import SettingsDep
from app.features.admin_auth import service
from app.features.admin_auth.cookie import AdminToken, clear_admin_cookie, set_admin_cookie
from app.features.admin_auth.deps import MaybeAdmin
from app.features.admin_auth.schemas import AdminChallenge, AdminSignIn, AdminUser, AdminVerify

router = APIRouter(prefix="/admin/auth", tags=["admin"])


# As in the mock, a malformed sign-in is just wrong credentials (401), and a malformed code step is
# an unknown challenge: neither answer says which field was off.
@router.post("/sign-in", openapi_extra=invalid_input("invalid_credentials", status=401))
async def admin_sign_in(
    body: AdminSignIn, session: SessionDep, settings: SettingsDep, now: Now
) -> AdminChallenge:
    challenge = await service.start_sign_in(session, settings, body.email, body.password, now)
    return AdminChallenge(challenge=challenge)


@router.post("/verify", openapi_extra=invalid_input("invalid_challenge"))
async def admin_verify(
    body: AdminVerify, session: SessionDep, settings: SettingsDep, now: Now, response: Response
) -> AdminUser:
    admin, token = await service.finish_sign_in(session, settings, body.challenge, body.code, now)
    set_admin_cookie(response, token)
    return admin


@router.get("/session")
async def read_admin_session(admin: MaybeAdmin) -> AdminUser:
    if admin is None:
        raise SignedOutError()
    return admin


@router.post("/sign-out", status_code=204)
async def admin_sign_out(session: SessionDep, response: Response, token: AdminToken = None) -> None:
    await service.sign_out(session, token)
    clear_admin_cookie(response)
