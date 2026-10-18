"""Guests: a random token, kept in a cookie, identifies a browser until its owner signs in.

These run inside the caller's transaction.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.tokens import hash_token, new_token
from app.features.guests.models import GuestRecord


async def find_guest(session: AsyncSession, token: str | None) -> GuestRecord | None:
    if not token:
        return None
    return await session.scalar(
        select(GuestRecord).where(GuestRecord.token_hash == hash_token(token))
    )


async def create_guest(session: AsyncSession) -> tuple[GuestRecord, str]:
    """A new guest and the token for its cookie. The token is only ever in the cookie."""
    token = new_token()
    guest = GuestRecord(token_hash=hash_token(token))
    session.add(guest)
    await session.flush()
    return guest, token
