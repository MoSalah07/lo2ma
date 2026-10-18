"""Who is asking: the signed-in user, for the routes that need to know."""

from typing import Annotated

from fastapi import Depends

from app.core.db import SessionDep
from app.core.now import Now
from app.features.auth import service
from app.features.auth.cookie import SessionToken
from app.features.auth.schemas import SessionUser


async def signed_in_user(
    session: SessionDep, now: Now, token: SessionToken = None
) -> SessionUser | None:
    return await service.find_session_user(session, token, now)


# The user, or None for a guest.
MaybeUser = Annotated[SessionUser | None, Depends(signed_in_user)]
