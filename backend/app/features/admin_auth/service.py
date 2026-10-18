"""Admins sign in apart from customers: an email and a password, then an authenticator code."""

import asyncio
import hmac
from datetime import datetime, timedelta
from functools import cache

import pyotp
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import DomainError, InvalidCodeError
from app.core.settings import Settings
from app.core.tokens import hash_token, new_token
from app.features.admin_auth.models import AdminChallengeRecord, AdminRecord, AdminSessionRecord
from app.features.admin_auth.schemas import AdminUser

CHALLENGE_LIFETIME = timedelta(minutes=5)
MAX_ATTEMPTS = 5
# A working day: an admin signs in again each morning.
SESSION_LIFETIME = timedelta(hours=12)
# Authenticator codes change every 30 seconds; one step either way allows for a phone's clock.
TOTP_STEP = timedelta(seconds=30)
TOTP_ISSUER = "Lo2ma"

# The demo's rules (LO2MA_DEMO_SIGN_IN), as in the mock.
DEMO_DOMAIN = "@lo2ma.test"
DEMO_MIN_PASSWORD = 8
DEMO_WRONG_CODE = "000000"
DEMO_NAME = "Lo2ma admin"

# argon2id with the library's current parameters: slow and memory-hungry on purpose, so guessing is
# expensive. It runs in a thread, since its 50 ms would stall every other request on the event loop.
_hasher = PasswordHasher()


class InvalidCredentialsError(DomainError):
    status = 401
    code = "invalid_credentials"


class InvalidChallengeError(DomainError):
    code = "invalid_challenge"


@cache
def _stand_in_hash() -> str:
    # Checked when no admin has the email, so a wrong email takes as long as a wrong password and
    # no one can tell which admins exist by timing the answer.
    return _hasher.hash("no admin has this email")


def _password_matches(password_hash: str, password: str) -> bool:
    """Runs in a thread. Without a hash it checks the stand-in, so the answer takes as long."""
    try:
        return _hasher.verify(password_hash or _stand_in_hash(), password)
    except VerificationError, InvalidHashError:
        return False


async def hash_password(password: str) -> str:
    return await asyncio.to_thread(_hasher.hash, password)


def to_admin_user(admin: AdminRecord) -> AdminUser:
    return AdminUser(id=str(admin.id), name=admin.name, email=admin.email)


async def _demo_admin(session: AsyncSession, email: str, password: str) -> AdminRecord:
    if not email.endswith(DEMO_DOMAIN) or len(password) < DEMO_MIN_PASSWORD:
        raise InvalidCredentialsError()
    await session.execute(
        insert(AdminRecord)
        .values(email=email, name=DEMO_NAME, password_hash="", totp_secret="")
        .on_conflict_do_nothing(index_elements=["email"])
    )
    return (await session.scalars(select(AdminRecord).where(AdminRecord.email == email))).one()


async def start_sign_in(
    session: AsyncSession, settings: Settings, email: str, password: str, now: datetime
) -> str:
    """The password step. Returns the challenge the code step must bring back."""
    email = email.strip().lower()
    async with session.begin():
        if settings.demo_sign_in:
            admin = await _demo_admin(session, email, password)
        else:
            admin = await session.scalar(select(AdminRecord).where(AdminRecord.email == email))
            # No such admin, or one the demo made (no password): never in, after the same wait.
            password_hash = admin.password_hash if admin else ""
            matches = await asyncio.to_thread(_password_matches, password_hash, password)
            if admin is None or not password_hash or not matches:
                raise InvalidCredentialsError()
        challenge = new_token()
        session.add(
            AdminChallengeRecord(
                admin_id=admin.id,
                token_hash=hash_token(challenge),
                expires_at=now + CHALLENGE_LIFETIME,
            )
        )
    return challenge


def _code_step(settings: Settings, admin: AdminRecord, code: str, now: datetime) -> int | None:
    """The time step of the authenticator code, if it is a valid one never used before."""
    if settings.demo_sign_in:
        return admin.totp_last_step if code != DEMO_WRONG_CODE else None
    if not admin.totp_secret:
        # The demo's admins have none, and an empty secret's codes are anyone's to work out.
        return None
    totp = pyotp.TOTP(admin.totp_secret)
    for drift in (-1, 0, 1):
        moment = now + drift * TOTP_STEP
        if hmac.compare_digest(totp.at(moment), code):
            step = totp.timecode(moment)
            # A code seen once (even by someone watching the screen) never works again.
            return step if step > admin.totp_last_step else None
    return None


async def finish_sign_in(
    session: AsyncSession, settings: Settings, challenge: str, code: str, now: datetime
) -> tuple[AdminUser, str]:
    """The code step: the admin and the new session's token.

    A wrong code counts against the challenge, and the count is saved before the refusal.
    """
    signed_in: tuple[AdminUser, str] | None = None
    async with session.begin():
        record = await session.scalar(
            select(AdminChallengeRecord)
            .where(
                AdminChallengeRecord.token_hash == hash_token(challenge),
                AdminChallengeRecord.used_at.is_(None),
                AdminChallengeRecord.expires_at > now,
            )
            .with_for_update()
        )
        if record is None or record.attempts >= MAX_ATTEMPTS:
            raise InvalidChallengeError()
        admin = await session.get_one(AdminRecord, record.admin_id, with_for_update=True)
        step = _code_step(settings, admin, code, now)
        if step is None:
            record.attempts += 1
        else:
            record.used_at = now
            admin.totp_last_step = step
            token = new_token()
            session.add(
                AdminSessionRecord(
                    admin_id=admin.id,
                    token_hash=hash_token(token),
                    created_at=now,
                    expires_at=now + SESSION_LIFETIME,
                )
            )
            signed_in = (to_admin_user(admin), token)
    if signed_in is None:
        raise InvalidCodeError()
    return signed_in


async def find_session_admin(
    session: AsyncSession, token: str | None, now: datetime
) -> AdminUser | None:
    if not token:
        return None
    async with session.begin():
        admin = await session.scalar(
            select(AdminRecord)
            .join(AdminSessionRecord, AdminSessionRecord.admin_id == AdminRecord.id)
            .where(
                AdminSessionRecord.token_hash == hash_token(token),
                AdminSessionRecord.expires_at > now,
            )
        )
    return to_admin_user(admin) if admin else None


async def sign_out(session: AsyncSession, token: str | None) -> None:
    if not token:
        return
    async with session.begin():
        await session.execute(
            delete(AdminSessionRecord).where(AdminSessionRecord.token_hash == hash_token(token))
        )


async def create_admin(
    session: AsyncSession, email: str, name: str, password: str
) -> tuple[AdminRecord, str]:
    """A new admin and the authenticator link to scan (otpauth://…), shown only this once."""
    secret = pyotp.random_base32()
    async with session.begin():
        admin = AdminRecord(
            email=email.strip().lower(),
            name=name,
            password_hash=await hash_password(password),
            totp_secret=secret,
        )
        session.add(admin)
    # pyotp leaves its extra **kwargs untyped.
    totp = pyotp.TOTP(secret)
    link = totp.provisioning_uri(name=admin.email, issuer_name=TOTP_ISSUER)  # pyright: ignore[reportUnknownMemberType]
    return admin, link
