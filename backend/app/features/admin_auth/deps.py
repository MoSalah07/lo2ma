"""Who is asking, for the dashboard's routes: the signed-in admin."""

from typing import Annotated

from fastapi import Depends

from app.core.db import SessionDep
from app.core.errors import AdminRequiredError
from app.core.now import Now
from app.features.admin_auth import service
from app.features.admin_auth.cookie import AdminToken
from app.features.admin_auth.schemas import AdminUser


async def signed_in_admin(
    session: SessionDep, now: Now, token: AdminToken = None
) -> AdminUser | None:
    return await service.find_session_admin(session, token, now)


async def required_admin(admin: Annotated[AdminUser | None, Depends(signed_in_admin)]) -> AdminUser:
    if admin is None:
        raise AdminRequiredError()
    return admin


# The admin, or None.
MaybeAdmin = Annotated[AdminUser | None, Depends(signed_in_admin)]
# Every data route of the dashboard: 401 admin_required without an admin session.
CurrentAdmin = Annotated[AdminUser, Depends(required_admin)]
