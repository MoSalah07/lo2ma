from datetime import date, datetime
from uuid import UUID, uuid7

from sqlalchemy import CheckConstraint, ForeignKey, false, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class CouponRecord(Base):
    """A discount code the operations team makes in the dashboard.

    Its status isn't stored: it has ended once `ends_on` has passed in Cairo or the uses ran out,
    and only a pause is kept (coupons/service.py).
    """

    __tablename__ = "coupons"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid7, server_default=func.uuidv7())
    # Upper case only (CHECK): no lo2ma10 can sit beside LO2MA10, so a plain UNIQUE is enough, and
    # checkout will look up what the customer typed in upper case.
    code: Mapped[str] = mapped_column(unique=True)
    # "percent": `discount_value` percent, up to `discount_cap` piasters. "amount": piasters off.
    discount_type: Mapped[str]
    discount_value: Mapped[int]
    discount_cap: Mapped[int | None]
    # Piasters of food, before delivery and service.
    min_order: Mapped[int]
    # "all", "new" (a first order) or "company" (its people only).
    audience: Mapped[str]
    company_id: Mapped[str | None] = mapped_column(ForeignKey("companies.id"), index=True)
    # How many orders may use it in all; None for no limit. ("limit" is an SQL word.)
    usage_limit: Mapped[int | None]
    per_customer: Mapped[int]
    # The last day it works, on Cairo's calendar.
    ends_on: Mapped[date]
    # Orders that used it. The demo's coupons come with the mock's counts.
    used: Mapped[int] = mapped_column(server_default="0")
    paused: Mapped[bool] = mapped_column(server_default=false())
    # Who made it, for the record. None for the seed's.
    created_by: Mapped[UUID | None] = mapped_column(
        ForeignKey("admins.id", ondelete="SET NULL"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    # What is true of any coupon. The business's limits (MIN_ORDER, MAX_PERCENT_OFF) are checked by
    # CreateCoupon instead: they can change, and old coupons made under the old ones stay valid.
    __table_args__ = (
        CheckConstraint("code = upper(code)", name="code_upper"),
        CheckConstraint("discount_type IN ('percent', 'amount')", name="discount_type"),
        CheckConstraint("discount_value > 0", name="discount_value"),
        CheckConstraint("discount_type <> 'percent' OR discount_value <= 100", name="percent_off"),
        # A percentage always has a cap, an amount never.
        CheckConstraint(
            "(discount_type = 'percent') = (discount_cap IS NOT NULL)", name="discount_cap"
        ),
        CheckConstraint("discount_cap > 0", name="discount_cap_positive"),
        CheckConstraint("min_order > 0", name="min_order"),
        CheckConstraint("audience IN ('all', 'new', 'company')", name="audience"),
        CheckConstraint("(audience = 'company') = (company_id IS NOT NULL)", name="company"),
        CheckConstraint("usage_limit > 0", name="usage_limit"),
        CheckConstraint("per_customer > 0", name="per_customer"),
        CheckConstraint("used >= 0", name="used"),
    )
