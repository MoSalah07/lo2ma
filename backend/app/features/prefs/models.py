from datetime import datetime, time
from uuid import UUID, uuid7

from sqlalchemy import ARRAY, CheckConstraint, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class PrefsRecord(Base):
    """A signed-in user's preferences, or a guest's."""

    __tablename__ = "prefs"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7, server_default=func.uuidv7())
    user_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    guest_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("guests.id", ondelete="CASCADE"), unique=True
    )
    workplace_name_ar: Mapped[str]
    workplace_name_en: Mapped[str]
    workplace_area_ar: Mapped[str]
    workplace_area_en: Mapped[str]
    workplace_lat: Mapped[float]
    workplace_lng: Mapped[float]
    workplace_details: Mapped[str]
    # A time of day on Cairo's clock, whatever the date: "13:30" all year.
    break_time: Mapped[time]
    budget: Mapped[int]
    # caloriePrefSchema as columns, so the database checks each mode has what it needs.
    calorie_mode: Mapped[str]
    calorie_kcal: Mapped[int | None]
    fit_protein: Mapped[int | None]
    fit_goal: Mapped[str | None]
    exclusions: Mapped[list[str]] = mapped_column(ARRAY(Text))
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (
        CheckConstraint("num_nonnulls(user_id, guest_id) = 1", name="one_owner"),
        CheckConstraint("workplace_lat BETWEEN -90 AND 90", name="workplace_lat"),
        CheckConstraint("workplace_lng BETWEEN -180 AND 180", name="workplace_lng"),
        CheckConstraint("char_length(workplace_details) <= 120", name="workplace_details"),
        CheckConstraint("budget >= 0", name="budget"),
        CheckConstraint("calorie_mode IN ('any', 'around', 'under', 'fit')", name="calorie_mode"),
        CheckConstraint("(calorie_mode = 'any') = (calorie_kcal IS NULL)", name="calorie_kcal"),
        CheckConstraint("(calorie_mode = 'fit') = (fit_protein IS NOT NULL)", name="fit_protein"),
        CheckConstraint(
            "fit_goal IS NULL OR (calorie_mode = 'fit' AND fit_goal IN ('cut', 'keep', 'bulk'))",
            name="fit_goal",
        ),
        CheckConstraint(
            "exclusions <@ ARRAY['chicken', 'beef', 'fish', 'nuts', 'dairy']::text[]",
            name="exclusions",
        ),
    )
