"""Guests: a random token, kept in a cookie, identifies a browser until its owner signs in."""

import hashlib
import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.guests.models import GuestRecord

TOKEN_BYTES = 32


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def find_guest(session: AsyncSession, token: str | None) -> GuestRecord | None:
    if not token:
        return None
    return await session.scalar(
        select(GuestRecord).where(GuestRecord.token_hash == hash_token(token))
    )


async def create_guest(session: AsyncSession) -> tuple[GuestRecord, str]:
    """A new guest and the token for its cookie. The token is only ever in the cookie."""
    token = secrets.token_urlsafe(TOKEN_BYTES)
    guest = GuestRecord(token_hash=hash_token(token))
    session.add(guest)
    await session.flush()
    return guest, token
