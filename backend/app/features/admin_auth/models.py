from datetime import datetime
from uuid import UUID, uuid7

from sqlalchemy import CheckConstraint, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class AdminRecord(Base):
    """Someone on the operations team. They sign in apart from customers, in two steps."""

    __tablename__ = "admins"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7, server_default=func.uuidv7())
    # Lower case.
    email: Mapped[str] = mapped_column(unique=True)
    name: Mapped[str]
    # argon2id, salted and slow on purpose. Empty for the demo's admins, who have no password here.
    password_hash: Mapped[str]
    # The authenticator app's shared secret (base32). Empty for the demo's admins.
    totp_secret: Mapped[str]
    # The last authenticator code's time step that signed in: the same code never works twice.
    totp_last_step: Mapped[int] = mapped_column(server_default="0")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())


class AdminChallengeRecord(Base):
    """Between the password and the authenticator code: proof that the password step passed."""

    __tablename__ = "admin_challenges"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7, server_default=func.uuidv7())
    admin_id: Mapped[UUID] = mapped_column(ForeignKey("admins.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(unique=True)
    attempts: Mapped[int] = mapped_column(server_default="0")
    expires_at: Mapped[datetime]
    used_at: Mapped[datetime | None]

    __table_args__ = (CheckConstraint("attempts >= 0", name="attempts"),)


class AdminSessionRecord(Base):
    """A signed-in admin's browser, apart from customers' sessions."""

    __tablename__ = "admin_sessions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7, server_default=func.uuidv7())
    admin_id: Mapped[UUID] = mapped_column(ForeignKey("admins.id", ondelete="CASCADE"), index=True)
    token_hash: Mapped[str] = mapped_column(unique=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    expires_at: Mapped[datetime]
