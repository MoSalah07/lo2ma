"""The coupon and company parts of apps/web/src/mocks/handlers/handlers.test.ts against the real
API, and what the mock can't show: Cairo's calendar, a status worked out from the date and the uses,
and who made each coupon."""

from datetime import UTC, date, datetime, timedelta
from typing import Any

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.companies.seed import load_companies, seed_companies
from app.features.coupons.models import CouponRecord
from app.features.coupons.seed import load_coupons, seed_coupons
from app.features.coupons.service import coupon_status
from tests.clock import Clock

pytestmark = pytest.mark.anyio

OFOK = {"id": "c1", "name": {"ar": "أفق للحلول", "en": "Ofok Solutions"}}
LUNCH15: dict[str, Any] = {
    "code": "LUNCH15",
    "discount": {"type": "percent", "value": 15, "cap": 3000},
    "minOrder": 10000,
    "audience": {"type": "company", "companyId": "c1"},
    "limit": 500,
    "perCustomer": 1,
    "endsOn": "2026-11-30",
}


@pytest.fixture
async def seeded(session: AsyncSession, clock: Clock) -> None:
    """The demo's companies and coupons, made an hour before the test's clock."""
    async with session.begin():
        await seed_companies(session, load_companies())
        await seed_coupons(session, load_coupons(), clock.now - timedelta(hours=1))


async def sign_in_admin(client: AsyncClient) -> None:
    """The demo's admin sign-in. Again after the clock moves past the 12-hour session."""
    credentials = {"email": "admin@lo2ma.test", "password": "correct horse"}
    started = await client.post("/api/admin/auth/sign-in", json=credentials)
    verify = {"challenge": started.json()["challenge"], "code": "482193"}
    assert (await client.post("/api/admin/auth/verify", json=verify)).status_code == 200


@pytest.fixture
async def admin(demo_client: AsyncClient, seeded: None) -> AsyncClient:
    """The demo app, with its data, and an admin signed in."""
    await sign_in_admin(demo_client)
    return demo_client


async def create(client: AsyncClient, **changes: Any) -> Any:
    return await client.post("/api/admin/coupons", json={**LUNCH15, **changes})


async def test_keeps_admin_data_away_from_customers_and_guests(
    demo_client: AsyncClient, seeded: None
) -> None:
    customer = {"channel": "phone", "destination": "01012345678", "code": "135790"}
    for signed_in in (False, True):
        if signed_in:
            await demo_client.post("/api/auth/verify", json=customer)
        for response in (
            await demo_client.get("/api/admin/companies"),
            await demo_client.get("/api/admin/coupons"),
            # Refused for who is asking before the body is even read.
            await demo_client.post("/api/admin/coupons", json={}),
        ):
            assert response.status_code == 401
            assert response.json() == {"code": "admin_required"}


async def test_lists_the_companies(admin: AsyncClient) -> None:
    companies = (await admin.get("/api/admin/companies")).json()
    assert [company["id"] for company in companies] == ["c1", "c2", "c3", "c4", "c5"]
    assert companies[0] == OFOK


async def test_lists_the_demo_coupons_with_their_status(admin: AsyncClient) -> None:
    coupons = (await admin.get("/api/admin/coupons")).json()
    assert [(coupon["code"], coupon["status"]) for coupon in coupons] == [
        ("LO2MA20", "active"),
        ("WELCOME30", "active"),
        ("OFOK15", "active"),
        ("NOON25", "paused"),
        ("LUNCH10", "ended"),
    ]
    assert coupons[2]["audience"] == {"type": "company", "company": OFOK}
    assert coupons[1]["discount"] == {"type": "amount", "value": 3000}
    assert coupons[1]["limit"] is None


async def test_saves_a_coupon_for_a_company_and_refuses_a_duplicate_code(
    admin: AsyncClient,
) -> None:
    created = await create(admin)
    assert created.status_code == 201
    assert created.json() == {
        **LUNCH15,
        "audience": {"type": "company", "company": OFOK},
        "used": 0,
        "status": "active",
    }

    again = await create(admin)
    assert again.status_code == 409
    assert again.json() == {"code": "duplicate_code"}

    coupons = (await admin.get("/api/admin/coupons")).json()
    assert coupons[0]["code"] == "LUNCH15"


async def test_saves_an_amount_off_for_new_customers(admin: AsyncClient) -> None:
    terms = {"discount": {"type": "amount", "value": 2500}, "audience": {"type": "new"}}
    created = await create(admin, code="HELLO25", limit=None, **terms)
    assert created.status_code == 201
    assert created.json() == {
        **LUNCH15,
        **terms,
        "code": "HELLO25",
        "limit": None,
        "used": 0,
        "status": "active",
    }


async def test_remembers_which_admin_made_a_coupon(
    admin: AsyncClient, session: AsyncSession
) -> None:
    await create(admin)
    made_by = await session.scalar(
        select(CouponRecord.created_by).where(CouponRecord.code == "LUNCH15")
    )
    assert str(made_by) == (await admin.get("/api/admin/auth/session")).json()["id"]


async def test_a_coupon_can_end_today_on_cairos_calendar(admin: AsyncClient, clock: Clock) -> None:
    # 22:30 on the 15th in UTC is already the 16th in Cairo.
    clock.now = datetime(2026, 10, 15, 22, 30, tzinfo=UTC)
    await sign_in_admin(admin)
    yesterday = await create(admin, endsOn="2026-10-15")
    assert yesterday.status_code == 400
    assert yesterday.json() == {"code": "ends_in_past"}
    assert (await create(admin, endsOn="2026-10-16")).status_code == 201


async def test_refuses_an_unknown_company(admin: AsyncClient) -> None:
    response = await create(admin, audience={"type": "company", "companyId": "c99"})
    assert response.status_code == 400
    assert response.json() == {"code": "unknown_company"}


@pytest.mark.parametrize(
    "changes",
    [
        {"code": "lunch 15"},
        {"code": "AB"},
        {"discount": {"type": "percent", "value": 95, "cap": 3000}},
        {"discount": {"type": "percent", "value": 15}},
        {"discount": {"type": "amount", "value": "2500"}},
        {"minOrder": 9900},
        {"limit": 0},
        {"perCustomer": 0},
        {"endsOn": "30/11/2026"},
        {"audience": {"type": "friends"}},
    ],
)
async def test_refuses_a_malformed_coupon(admin: AsyncClient, changes: dict[str, Any]) -> None:
    response = await create(admin, **changes)
    assert response.status_code == 400
    assert response.json() == {"code": "invalid_coupon"}


async def test_a_coupon_ends_after_its_last_day(admin: AsyncClient, clock: Clock) -> None:
    # 1 November, 00:30 in Cairo: UTC+2 again since summer time ended on 29 October.
    clock.now = datetime(2026, 10, 31, 22, 30, tzinfo=UTC)
    await sign_in_admin(admin)
    coupons = (await admin.get("/api/admin/coupons")).json()
    assert coupons[0] == {**coupons[0], "code": "LO2MA20", "status": "ended"}


async def test_seeding_again_keeps_the_coupons_admins_made(
    admin: AsyncClient, session: AsyncSession, clock: Clock
) -> None:
    await create(admin)
    async with session.begin():
        await seed_coupons(session, load_coupons(), clock.now)
    codes = [coupon["code"] for coupon in (await admin.get("/api/admin/coupons")).json()]
    assert sorted(codes) == ["LO2MA20", "LUNCH10", "LUNCH15", "NOON25", "OFOK15", "WELCOME30"]


@pytest.mark.parametrize(
    ("changes", "constraint"),
    [
        ({"code": "lo2ma10"}, "ck_coupons_code_upper"),
        ({"discount_cap": None}, "ck_coupons_discount_cap"),
        ({"discount_value": 120}, "ck_coupons_percent_off"),
        ({"audience": "company"}, "ck_coupons_company"),
    ],
)
async def test_the_database_refuses_a_coupon_that_cannot_be(
    session: AsyncSession, changes: dict[str, Any], constraint: str
) -> None:
    terms: dict[str, Any] = {
        "code": "LO2MA10",
        "discount_type": "percent",
        "discount_value": 10,
        "discount_cap": 2000,
        "min_order": 10000,
        "audience": "all",
        "per_customer": 1,
        "ends_on": date(2026, 10, 31),
    }
    session.add(CouponRecord(**{**terms, **changes}))
    with pytest.raises(IntegrityError, match=constraint):
        await session.flush()


def coupon(**changes: Any) -> CouponRecord:
    terms: dict[str, Any] = {"ends_on": date(2026, 10, 31), "used": 10, "usage_limit": 100}
    return CouponRecord(**{**terms, "paused": False, **changes})


@pytest.mark.parametrize(
    ("changes", "status"),
    [
        ({}, "active"),
        ({"paused": True}, "paused"),
        ({"ends_on": date(2026, 10, 15)}, "active"),
        ({"ends_on": date(2026, 10, 14)}, "ended"),
        ({"used": 100}, "ended"),
        ({"used": 5000, "usage_limit": None}, "active"),
        ({"paused": True, "ends_on": date(2026, 10, 14)}, "ended"),
    ],
)
def test_a_coupons_status(changes: dict[str, Any], status: str) -> None:
    assert coupon_status(coupon(**changes), today=date(2026, 10, 15)) == status
