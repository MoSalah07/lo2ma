"""The demo's coupons from backend/seed/coupons.json (written from the mock's data)."""

from datetime import datetime, timedelta
from pathlib import Path

from pydantic import TypeAdapter
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.coupons.models import CouponRecord
from app.features.coupons.schemas import CreateCoupon
from app.features.coupons.service import coupon_columns

SEED = Path(__file__).resolve().parents[3] / "seed" / "coupons.json"


class SeedCoupon(CreateCoupon):
    """A coupon as the mock has it: with its uses so far, and whether it's paused."""

    used: int
    paused: bool


def load_coupons() -> list[SeedCoupon]:
    return TypeAdapter(list[SeedCoupon]).validate_json(SEED.read_bytes())


async def seed_coupons(session: AsyncSession, coupons: list[SeedCoupon], now: datetime) -> None:
    """Writes the coupons by code, inside the caller's transaction. Coupons an admin made stay.

    They're dated a minute apart back from `now`, so the newest-first list keeps the mock's order.
    """
    rows = [
        {
            **coupon_columns(coupon),
            "used": coupon.used,
            "paused": coupon.paused,
            "created_at": now - timedelta(minutes=index),
        }
        for index, coupon in enumerate(coupons)
    ]
    statement = insert(CouponRecord).values(rows)
    changes = {column: statement.excluded[column] for column in rows[0] if column != "code"}
    await session.execute(statement.on_conflict_do_update(index_elements=["code"], set_=changes))
