from datetime import datetime
from uuid import UUID, uuid7

from sqlalchemy import func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class GuestRecord(Base):
    """Someone using Lo2ma without an account: browsing, chatting and saving preferences."""

    __tablename__ = "guests"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7, server_default=func.uuidv7())
    # The SHA-256 of the cookie's token, never the token: a leaked table opens no one's preferences.
    token_hash: Mapped[str] = mapped_column(unique=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
