"""The admin session cookie: its own name, so a customer's session never opens the dashboard."""

from typing import Annotated

from fastapi import Cookie, Response

from app.features.admin_auth.service import SESSION_LIFETIME

ADMIN_COOKIE = "__Host-lo2ma_admin"

AdminToken = Annotated[str | None, Cookie(alias=ADMIN_COOKIE)]


def set_admin_cookie(response: Response, token: str) -> None:
    # The same protections as the customer's cookie (features/auth/cookie.py).
    response.set_cookie(
        ADMIN_COOKIE,
        token,
        max_age=int(SESSION_LIFETIME.total_seconds()),
        path="/",
        httponly=True,
        secure=True,
        samesite="lax",
    )


def clear_admin_cookie(response: Response) -> None:
    response.delete_cookie(ADMIN_COOKIE, path="/", httponly=True, secure=True, samesite="lax")
