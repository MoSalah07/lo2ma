from typing import Annotated

from pydantic import Field

from app.core.api_model import ApiModel


class AdminSignIn(ApiModel):
    """The password step (adminSignInSchema)."""

    email: str
    password: Annotated[str, Field(min_length=1)]


class AdminChallenge(ApiModel):
    """What the password step hands back for the code step (adminChallengeSchema)."""

    challenge: str


class AdminVerify(ApiModel):
    """The code step: the challenge and the authenticator's code (adminVerifySchema)."""

    challenge: str
    code: Annotated[str, Field(pattern=r"^[0-9]{6}$")]


class AdminUser(ApiModel):
    """The signed-in admin (adminUserSchema)."""

    id: str
    name: str
    email: str
