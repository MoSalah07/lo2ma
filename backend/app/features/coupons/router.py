from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.db import SessionDep
from app.core.errors import invalid_input
from app.core.now import Now
from app.features.admin_auth.deps import CurrentAdmin, required_admin
from app.features.coupons import service
from app.features.coupons.schemas import Coupon, CreateCoupon

# Admins only, before anything else: a customer's malformed coupon is 401, not 400 (as in the mock).
router = APIRouter(prefix="/admin/coupons", tags=["admin"], dependencies=[Depends(required_admin)])


@router.get("")
async def list_coupons(session: SessionDep, now: Now) -> list[Coupon]:
    return await service.list_coupons(session, now)


@router.post("", status_code=201, openapi_extra=invalid_input("invalid_coupon"))
async def create_coupon(
    body: CreateCoupon, admin: CurrentAdmin, session: SessionDep, now: Now
) -> Coupon:
    return await service.create_coupon(session, body, UUID(admin.id), now)
