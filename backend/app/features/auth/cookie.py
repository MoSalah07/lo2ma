"""The session cookie, the HTTP side of signing in."""

from typing import Annotated

from fastapi import Cookie, Response

# __Host-: only over HTTPS (localhost counts), for the whole site, from this host alone.
SESSION_COOKIE = "__Host-lo2ma_session"
SESSION_COOKIE_MAX_AGE = 30 * 24 * 60 * 60

SessionToken = Annotated[str | None, Cookie(alias=SESSION_COOKIE)]


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=SESSION_COOKIE_MAX_AGE,
        path="/",
        # JavaScript can't read it, and another site's form never sends it along with a POST.
        httponly=True,
        secure=True,
        samesite="lax",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE, path="/", httponly=True, secure=True, samesite="lax")
