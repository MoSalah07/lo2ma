from typing import Annotated, Literal

from pydantic import Field
from pydantic.json_schema import SkipJsonSchema

from app.core.api_model import ApiModel, omitted

OtpChannel = Literal["phone", "email"]


class OtpRequest(ApiModel):
    """Where to send a sign-in code (otpRequestSchema)."""

    channel: OtpChannel
    destination: Annotated[str, Field(min_length=1)]


class OtpVerify(OtpRequest):
    """The code the user typed (otpVerifySchema)."""

    code: Annotated[str, Field(pattern=r"^[0-9]{6}$")]


class OtpSent(ApiModel):
    """How long the code works, in seconds."""

    expires_in: int


class SessionUser(ApiModel):
    """The signed-in user (sessionUserSchema)."""

    id: str
    name: str
    phone: str | SkipJsonSchema[None] = omitted()
    email: str | SkipJsonSchema[None] = omitted()
