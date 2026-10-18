"""Signing in with a one-time code sent to a phone or an email, and the session that follows."""

import hashlib
import hmac
import logging
import re
import secrets
from datetime import datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import DomainError, InvalidRequestError
from app.core.settings import Settings
from app.core.tokens import hash_token, new_token
from app.domain.phone import normalize_egypt_mobile
from app.domain.rules import OTP_LENGTH
from app.features.auth.models import OtpCodeRecord, SessionRecord, UserRecord
from app.features.auth.schemas import OtpChannel, SessionUser
from app.features.prefs.service import copy_guest_prefs

logger = logging.getLogger(__name__)

CODE_LIFETIME = timedelta(minutes=5)
MAX_ATTEMPTS = 5
# Every code may cost an SMS. A destination gets a few an hour, with a wait between two, so nobody
# can pump messages to numbers that pay them.
CODES_PER_HOUR = 5
RESEND_AFTER = timedelta(seconds=30)
SESSION_LIFETIME = timedelta(days=30)
# The demo's "wrong code", to show that state (LO2MA_OTP_DEMO).
DEMO_WRONG_CODE = "000000"

_EMAIL = re.compile(r"\S+@\S+\.\S+")


class InvalidDestinationError(DomainError):
    code = "invalid_destination"


class InvalidCodeError(DomainError):
    code = "invalid_code"


class SignedOutError(DomainError):
    status = 401
    code = "signed_out"


def normalize_destination(channel: OtpChannel, destination: str) -> str | None:
    """The national phone number, or the lower-case email; None when it's neither."""
    if channel == "phone":
        return normalize_egypt_mobile(destination)
    return destination.lower() if _EMAIL.fullmatch(destination) else None


def new_code() -> str:
    # secrets, not random: random's numbers can be predicted from a few of them.
    return f"{secrets.randbelow(10**OTP_LENGTH):0{OTP_LENGTH}d}"


def code_hash(pepper: str, destination: str, code: str) -> str:
    # A million codes are tried in a second against a plain hash; not without the pepper.
    return hmac.new(pepper.encode(), f"{destination}:{code}".encode(), hashlib.sha256).hexdigest()


def _send_code(settings: Settings, channel: OtpChannel, destination: str, code: str) -> None:
    # No SMS or email provider yet: outside production the code goes to the log for a developer.
    if settings.environment == "prod":
        logger.error("No sign-in code provider: a %s code could not be sent", channel)
    else:
        logger.info("Sign-in code for %s %s: %s", channel, destination, code)


async def request_code(
    session: AsyncSession, settings: Settings, channel: OtpChannel, destination: str, now: datetime
) -> int:
    """Sends a new code and returns how many seconds it works.

    Over the limit nothing is sent, and the answer is the same: no one learns that a limit was hit,
    or whether a number has an account. The last code still works until it expires.
    """
    target = normalize_destination(channel, destination)
    if target is None:
        raise InvalidDestinationError()
    lifetime = int(CODE_LIFETIME.total_seconds())
    async with session.begin():
        recent = list(
            await session.scalars(
                select(OtpCodeRecord.created_at)
                .where(
                    OtpCodeRecord.destination == target,
                    OtpCodeRecord.created_at > now - timedelta(hours=1),
                )
                .order_by(OtpCodeRecord.created_at.desc())
            )
        )
        if len(recent) >= CODES_PER_HOUR or (recent and now - recent[0] < RESEND_AFTER):
            return lifetime
        code = new_code()
        pepper = settings.otp_pepper.get_secret_value()
        session.add(
            OtpCodeRecord(
                channel=channel,
                destination=target,
                code_hash=code_hash(pepper, target, code),
                created_at=now,
                expires_at=now + CODE_LIFETIME,
            )
        )
    _send_code(settings, channel, target, code)
    return lifetime


async def _find_or_create_user(
    session: AsyncSession, channel: OtpChannel, target: str
) -> UserRecord:
    column = UserRecord.phone if channel == "phone" else UserRecord.email
    # Two first sign-ins at once both get here; the unique column lets only one row in.
    await session.execute(
        insert(UserRecord)
        .values({column.key: target})
        .on_conflict_do_nothing(index_elements=[column])
    )
    return (await session.scalars(select(UserRecord).where(column == target))).one()


def to_session_user(user: UserRecord) -> SessionUser:
    return SessionUser(id=str(user.id), name=user.name, phone=user.phone, email=user.email)


async def verify_code(
    session: AsyncSession,
    settings: Settings,
    attempt: tuple[OtpChannel, str, str],
    guest_token: str | None,
    now: datetime,
) -> tuple[SessionUser, str]:
    """Checks (channel, destination, code) and starts a new session: the user, and its token.

    A wrong code counts against the newest one, and that count is saved before the refusal.
    """
    channel, destination, code = attempt
    target = normalize_destination(channel, destination)
    if target is None:
        raise InvalidRequestError()
    pepper = settings.otp_pepper.get_secret_value()
    async with session.begin():
        latest = await session.scalar(
            select(OtpCodeRecord)
            .where(
                OtpCodeRecord.destination == target,
                OtpCodeRecord.used_at.is_(None),
                OtpCodeRecord.expires_at > now,
            )
            .order_by(OtpCodeRecord.created_at.desc())
            .limit(1)
            # Two tries at once wait for each other, so both count.
            .with_for_update()
        )
        if settings.otp_demo:
            accepted = code != DEMO_WRONG_CODE
        else:
            accepted = (
                latest is not None
                and latest.attempts < MAX_ATTEMPTS
                and hmac.compare_digest(latest.code_hash, code_hash(pepper, target, code))
            )
        signed_in: tuple[SessionUser, str] | None = None
        if not accepted:
            if latest is not None:
                latest.attempts += 1
            # Leaving the block commits the count; the refusal comes after it.
        else:
            if latest is not None:
                latest.used_at = now
            user = await _find_or_create_user(session, channel, target)
            token = new_token()
            session.add(
                SessionRecord(
                    user_id=user.id,
                    token_hash=hash_token(token),
                    created_at=now,
                    expires_at=now + SESSION_LIFETIME,
                )
            )
            await copy_guest_prefs(session, guest_token, user.id)
            signed_in = (to_session_user(user), token)
    if signed_in is None:
        raise InvalidCodeError()
    return signed_in


async def find_session_user(
    session: AsyncSession, token: str | None, now: datetime
) -> SessionUser | None:
    if not token:
        return None
    async with session.begin():
        user = await session.scalar(
            select(UserRecord)
            .join(SessionRecord, SessionRecord.user_id == UserRecord.id)
            .where(SessionRecord.token_hash == hash_token(token), SessionRecord.expires_at > now)
        )
    return to_session_user(user) if user else None


async def sign_out(session: AsyncSession, token: str | None) -> None:
    if not token:
        return
    async with session.begin():
        await session.execute(
            delete(SessionRecord).where(SessionRecord.token_hash == hash_token(token))
        )
