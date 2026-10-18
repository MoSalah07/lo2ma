from datetime import date
from typing import Annotated, Literal

from pydantic import Field

from app.core.api_model import ApiModel
from app.domain.rules import COUPON_CODE, MAX_PERCENT_OFF, MIN_ORDER
from app.features.companies.schemas import Company

# Piasters, more than none.
PositivePiasters = Annotated[int, Field(strict=True, gt=0)]
Count = Annotated[int, Field(strict=True, gt=0)]

CouponStatus = Literal["active", "paused", "ended"]


class PercentOff(ApiModel):
    """A share of the food, up to a cap in piasters."""

    type: Literal["percent"]
    value: Annotated[int, Field(strict=True, ge=1, le=MAX_PERCENT_OFF)]
    cap: PositivePiasters


class AmountOff(ApiModel):
    type: Literal["amount"]
    value: PositivePiasters


CouponDiscount = Annotated[PercentOff | AmountOff, Field(discriminator="type")]


class AllCustomers(ApiModel):
    type: Literal["all"]


class NewCustomers(ApiModel):
    """A customer's first order."""

    type: Literal["new"]


class CompanyChoice(ApiModel):
    """One company's people, as the form picks it: by id."""

    type: Literal["company"]
    company_id: str


class CompanyCustomers(ApiModel):
    """One company's people, as the dashboard shows it: with the name."""

    type: Literal["company"]
    company: Company


class _CouponTerms(ApiModel):
    code: Annotated[str, Field(pattern=COUPON_CODE)]
    discount: CouponDiscount
    # A coupon can't lower Lo2ma's minimum order.
    min_order: Annotated[int, Field(strict=True, ge=MIN_ORDER)]
    # None means no limit.
    limit: Count | None
    per_customer: Count
    # The last day it works, "YYYY-MM-DD".
    ends_on: date


class CreateCoupon(_CouponTerms):
    """What the coupon form sends (createCouponSchema)."""

    audience: Annotated[AllCustomers | NewCustomers | CompanyChoice, Field(discriminator="type")]


class Coupon(_CouponTerms):
    """A coupon in the dashboard's list (couponSchema)."""

    audience: Annotated[AllCustomers | NewCustomers | CompanyCustomers, Field(discriminator="type")]
    used: Annotated[int, Field(strict=True, ge=0)]
    status: CouponStatus
