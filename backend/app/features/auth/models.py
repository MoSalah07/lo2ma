from datetime import datetime
from uuid import UUID, uuid7

from sqlalchemy import CheckConstraint, ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class UserRecord(Base):
    """An account: made the first time a phone number or an email passes its sign-in code."""

    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7, server_default=func.uuidv7())
    # National Egyptian mobile number, 10 digits ("1012345678").
    phone: Mapped[str | None] = mapped_column(unique=True)
    # Lower case.
    email: Mapped[str | None] = mapped_column(unique=True)
    name: Mapped[str] = mapped_column(server_default="")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (CheckConstraint("num_nonnulls(phone, email) >= 1", name="reachable"),)


class SessionRecord(Base):
    """A signed-in browser. The cookie holds the token; this table only its SHA-256."""

    __tablename__ = "sessions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7, server_default=func.uuidv7())
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(unique=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    expires_at: Mapped[datetime]


class OtpCodeRecord(Base):
    """A sign-in code sent to a phone or an email. Only a destination's newest unused one counts."""

    __tablename__ = "otp_codes"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7, server_default=func.uuidv7())
    channel: Mapped[str]
    # Normalized: the national phone number, or the lower-case email.
    destination: Mapped[str]
    # HMAC-SHA256 of destination and code with the server's pepper.
    code_hash: Mapped[str]
    attempts: Mapped[int] = mapped_column(server_default="0")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    expires_at: Mapped[datetime]
    used_at: Mapped[datetime | None]

    __table_args__ = (
        CheckConstraint("channel IN ('phone', 'email')", name="channel"),
        CheckConstraint("attempts >= 0", name="attempts"),
        Index("ix_otp_codes_destination_created_at", "destination", "created_at"),
    )
