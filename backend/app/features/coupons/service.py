"""Coupons, as the dashboard makes and lists them. Taking one off a bill comes with checkout."""

from datetime import date, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import DomainError
from app.domain.clock import in_cairo
from app.features.companies.models import CompanyRecord
from app.features.companies.schemas import to_company
from app.features.coupons.models import CouponRecord
from app.features.coupons.schemas import (
    AllCustomers,
    AmountOff,
    CompanyChoice,
    CompanyCustomers,
    Coupon,
    CouponStatus,
    CreateCoupon,
    NewCustomers,
    PercentOff,
)


class EndsInPastError(DomainError):
    code = "ends_in_past"


class DuplicateCodeError(DomainError):
    status = 409
    code = "duplicate_code"


class UnknownCompanyError(DomainError):
    code = "unknown_company"


def coupon_status(record: CouponRecord, today: date) -> CouponStatus:
    """Ended once its last day has passed or its uses ran out, whether paused or not."""
    ran_out = record.usage_limit is not None and record.used >= record.usage_limit
    if record.ends_on < today or ran_out:
        return "ended"
    return "paused" if record.paused else "active"


def _audience(
    record: CouponRecord, company: CompanyRecord | None
) -> AllCustomers | NewCustomers | CompanyCustomers:
    if company is not None:
        return CompanyCustomers(type="company", company=to_company(company))
    if record.audience == "new":
        return NewCustomers(type="new")
    return AllCustomers(type="all")


def to_coupon(record: CouponRecord, company: CompanyRecord | None, today: date) -> Coupon:
    cap = record.discount_cap
    # The table keeps a cap on every percentage, and none on an amount.
    discount = (
        PercentOff(type="percent", value=record.discount_value, cap=cap)
        if record.discount_type == "percent" and cap is not None
        else AmountOff(type="amount", value=record.discount_value)
    )
    return Coupon(
        code=record.code,
        discount=discount,
        min_order=record.min_order,
        audience=_audience(record, company),
        limit=record.usage_limit,
        per_customer=record.per_customer,
        ends_on=record.ends_on,
        used=record.used,
        status=coupon_status(record, today),
    )


def coupon_columns(coupon: CreateCoupon) -> dict[str, object]:
    """A coupon's terms as the table's columns."""
    discount, audience = coupon.discount, coupon.audience
    return {
        "code": coupon.code,
        "discount_type": discount.type,
        "discount_value": discount.value,
        "discount_cap": discount.cap if isinstance(discount, PercentOff) else None,
        "min_order": coupon.min_order,
        "audience": audience.type,
        "company_id": audience.company_id if isinstance(audience, CompanyChoice) else None,
        "usage_limit": coupon.limit,
        "per_customer": coupon.per_customer,
        "ends_on": coupon.ends_on,
    }


async def list_coupons(session: AsyncSession, now: datetime) -> list[Coupon]:
    today = in_cairo(now).date()
    async with session.begin():
        rows = await session.execute(
            select(CouponRecord, CompanyRecord)
            .outerjoin(CompanyRecord, CompanyRecord.id == CouponRecord.company_id)
            # Newest first; of two made in the same moment, the one saved last.
            .order_by(CouponRecord.created_at.desc(), CouponRecord.id.desc())
        )
        return [to_coupon(coupon, company, today) for coupon, company in rows]


async def create_coupon(
    session: AsyncSession, coupon: CreateCoupon, admin_id: UUID, now: datetime
) -> Coupon:
    """Checked in the mock's order: the last day, the code, then the company."""
    today = in_cairo(now).date()
    if coupon.ends_on < today:
        raise EndsInPastError()
    async with session.begin():
        taken = await session.scalar(
            select(CouponRecord.id).where(CouponRecord.code == coupon.code)
        )
        if taken is not None:
            raise DuplicateCodeError()
        company = None
        if isinstance(coupon.audience, CompanyChoice):
            company = await session.get(CompanyRecord, coupon.audience.company_id)
            if company is None:
                raise UnknownCompanyError()
        record = await session.scalar(
            insert(CouponRecord)
            .values(**coupon_columns(coupon), created_by=admin_id, created_at=now)
            # Two admins saving one code at the same moment: the second is a duplicate too.
            .on_conflict_do_nothing(index_elements=["code"])
            .returning(CouponRecord)
        )
        if record is None:
            raise DuplicateCodeError()
        return to_coupon(record, company, today)
