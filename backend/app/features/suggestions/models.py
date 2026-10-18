from datetime import datetime
from uuid import UUID, uuid7

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class DishReportRecord(Base):
    """«الطبق جالك مختلف؟»: someone said an estimated dish came different. Phase 3 reviews them.

    Who said it is kept when known, so one person can't outweigh everyone else.
    """

    __tablename__ = "dish_reports"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7, server_default=func.uuidv7())
    dish_id: Mapped[str] = mapped_column(ForeignKey("dishes.id"), index=True)
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    guest_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("guests.id", ondelete="SET NULL"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
