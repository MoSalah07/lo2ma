"""The guest cookie, the HTTP side of guests."""

from typing import Annotated

from fastapi import Cookie, Response

# __Host-: the browser only takes it over HTTPS (localhost counts), for the whole site, from this
# host alone.
GUEST_COOKIE = "__Host-lo2ma_guest"
# A year, so preferences outlive a few weeks away.
GUEST_COOKIE_MAX_AGE = 365 * 24 * 60 * 60

GuestToken = Annotated[str | None, Cookie(alias=GUEST_COOKIE)]


def set_guest_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        GUEST_COOKIE,
        token,
        max_age=GUEST_COOKIE_MAX_AGE,
        path="/",
        # JavaScript can't read it, and another site's form never sends it along with a POST.
        httponly=True,
        secure=True,
        samesite="lax",
    )
