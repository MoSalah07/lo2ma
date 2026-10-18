"""The admin sign-in part of apps/web/src/mocks/handlers/handlers.test.ts against the real API, and
what a real one has to get right: argon2 passwords, authenticator codes that work once, challenges
that expire and run out of tries, and a session apart from customers'."""

from datetime import timedelta

import pyotp
import pytest
from fastapi import FastAPI
from httpx import AsyncClient, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.admin_auth import service
from app.features.admin_auth.cookie import ADMIN_COOKIE
from app.features.admin_auth.deps import CurrentAdmin
from app.features.admin_auth.models import AdminSessionRecord
from app.features.admin_auth.schemas import AdminUser
from app.features.admin_auth.service import TOTP_STEP
from tests.clock import Clock

pytestmark = pytest.mark.anyio

EMAIL = "mona@lo2ma.com"
PASSWORD = "a long admin password"
# Every admin made here gets this authenticator secret, so the codes are the same each run.
SECRET = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"


def add_probe(app: FastAPI) -> None:
    """A dashboard route, the way the admin data routes use CurrentAdmin."""

    @app.get("/api/admin/probe")
    async def probe(admin: CurrentAdmin) -> AdminUser:
        return admin


@pytest.fixture
def app(app: FastAPI) -> FastAPI:
    add_probe(app)
    return app


@pytest.fixture
def demo_app(demo_app: FastAPI) -> FastAPI:
    add_probe(demo_app)
    return demo_app


@pytest.fixture
async def totp(session: AsyncSession, monkeypatch: pytest.MonkeyPatch) -> pyotp.TOTP:
    """A real admin (not the demo's), and the authenticator app on their phone."""
    monkeypatch.setattr(pyotp, "random_base32", lambda: SECRET)
    await service.create_admin(session, EMAIL, "Mona", PASSWORD)
    return pyotp.TOTP(SECRET)


async def challenge(client: AsyncClient, email: str = EMAIL, password: str = PASSWORD) -> str:
    body = {"email": email, "password": password}
    response = await client.post("/api/admin/auth/sign-in", json=body)
    assert response.status_code == 200
    return response.json()["challenge"]


async def verify(client: AsyncClient, challenge: str, code: str) -> Response:
    return await client.post("/api/admin/auth/verify", json={"challenge": challenge, "code": code})


async def sign_in(client: AsyncClient, totp: pyotp.TOTP, clock: Clock) -> Response:
    return await verify(client, await challenge(client), totp.at(clock.now))


async def test_signs_in_with_a_password_then_an_authenticator_code(
    db_client: AsyncClient, clock: Clock, totp: pyotp.TOTP
) -> None:
    response = await sign_in(db_client, totp, clock)
    assert response.status_code == 200
    admin = response.json()
    assert (admin["name"], admin["email"]) == ("Mona", EMAIL)

    cookie = response.headers["set-cookie"]
    assert cookie.startswith(f"{ADMIN_COOKIE}=")
    for attribute in ("HttpOnly", "Secure", "SameSite=lax", "Path=/", "Max-Age=43200"):
        assert attribute in cookie
    session = await db_client.get("/api/admin/auth/session")
    assert session.json() == admin


async def test_a_wrong_password_and_an_unknown_email_get_the_same_answer(
    db_client: AsyncClient, totp: pyotp.TOTP
) -> None:
    for body in (
        {"email": EMAIL, "password": "not the password"},
        {"email": "someone@lo2ma.com", "password": PASSWORD},
    ):
        response = await db_client.post("/api/admin/auth/sign-in", json=body)
        assert response.status_code == 401
        assert response.json() == {"code": "invalid_credentials"}


async def test_an_email_matches_in_any_case(
    db_client: AsyncClient, clock: Clock, totp: pyotp.TOTP
) -> None:
    assert await challenge(db_client, email=" Mona@Lo2ma.com ")


async def test_a_malformed_sign_in_is_just_wrong_credentials(db_client: AsyncClient) -> None:
    response = await db_client.post("/api/admin/auth/sign-in", json={"email": EMAIL})
    assert response.status_code == 401
    assert response.json() == {"code": "invalid_credentials"}


async def test_a_malformed_code_step_is_an_unknown_challenge(
    db_client: AsyncClient, clock: Clock, totp: pyotp.TOTP
) -> None:
    for code in ("12", "made up"):
        response = await verify(db_client, await challenge(db_client), code)
        assert response.status_code == 400
        assert response.json() == {"code": "invalid_challenge"}
    response = await verify(db_client, "made-up-challenge", totp.at(clock.now))
    assert response.json() == {"code": "invalid_challenge"}


async def test_five_wrong_codes_end_the_challenge(
    db_client: AsyncClient, clock: Clock, totp: pyotp.TOTP
) -> None:
    started = await challenge(db_client)
    for _ in range(service.MAX_ATTEMPTS):
        response = await verify(db_client, started, "000000")
        assert response.status_code == 400
        assert response.json() == {"code": "invalid_code"}
    response = await verify(db_client, started, totp.at(clock.now))
    assert response.json() == {"code": "invalid_challenge"}


async def test_a_challenge_lasts_five_minutes(
    db_client: AsyncClient, clock: Clock, totp: pyotp.TOTP
) -> None:
    started = await challenge(db_client)
    clock.now += timedelta(minutes=5)
    response = await verify(db_client, started, totp.at(clock.now))
    assert response.json() == {"code": "invalid_challenge"}


async def test_a_challenge_works_once(
    db_client: AsyncClient, clock: Clock, totp: pyotp.TOTP
) -> None:
    started = await challenge(db_client)
    assert (await verify(db_client, started, totp.at(clock.now))).status_code == 200
    clock.now += TOTP_STEP
    response = await verify(db_client, started, totp.at(clock.now))
    assert response.json() == {"code": "invalid_challenge"}


async def test_a_code_works_once_even_with_a_new_challenge(
    db_client: AsyncClient, clock: Clock, totp: pyotp.TOTP
) -> None:
    code = totp.at(clock.now)
    assert (await verify(db_client, await challenge(db_client), code)).status_code == 200
    again = await verify(db_client, await challenge(db_client), code)
    assert again.json() == {"code": "invalid_code"}
    # The authenticator's next code is fine.
    clock.now += TOTP_STEP
    assert (await sign_in(db_client, totp, clock)).status_code == 200


async def test_allows_for_a_phone_clock_one_step_off(
    db_client: AsyncClient, clock: Clock, totp: pyotp.TOTP
) -> None:
    late = totp.at(clock.now - TOTP_STEP)
    assert (await verify(db_client, await challenge(db_client), late)).status_code == 200
    too_late = totp.at(clock.now - 2 * TOTP_STEP)
    response = await verify(db_client, await challenge(db_client), too_late)
    assert response.json() == {"code": "invalid_code"}


async def test_an_admin_session_lasts_twelve_hours(
    db_client: AsyncClient, clock: Clock, totp: pyotp.TOTP
) -> None:
    await sign_in(db_client, totp, clock)
    clock.now += timedelta(hours=12)
    response = await db_client.get("/api/admin/auth/session")
    assert response.status_code == 401
    assert response.json() == {"code": "signed_out"}


async def test_signing_out_ends_the_admin_session(
    db_client: AsyncClient, clock: Clock, totp: pyotp.TOTP, session: AsyncSession
) -> None:
    await sign_in(db_client, totp, clock)
    response = await db_client.post("/api/admin/auth/sign-out")
    assert response.status_code == 204
    assert f'{ADMIN_COOKIE}=""' in response.headers["set-cookie"]
    assert (await db_client.get("/api/admin/auth/session")).status_code == 401
    assert await session.scalar(select(func.count()).select_from(AdminSessionRecord)) == 0


async def test_signing_out_without_a_session_is_fine(db_client: AsyncClient) -> None:
    assert (await db_client.post("/api/admin/auth/sign-out")).status_code == 204


async def test_the_dashboard_needs_an_admin(
    db_client: AsyncClient, clock: Clock, totp: pyotp.TOTP
) -> None:
    response = await db_client.get("/api/admin/probe")
    assert response.status_code == 401
    assert response.json() == {"code": "admin_required"}
    await sign_in(db_client, totp, clock)
    assert (await db_client.get("/api/admin/probe")).json()["email"] == EMAIL


async def test_an_admin_session_is_not_a_customer_session(
    db_client: AsyncClient, clock: Clock, totp: pyotp.TOTP
) -> None:
    await sign_in(db_client, totp, clock)
    assert (await db_client.get("/api/auth/session")).status_code == 401


async def test_a_customer_session_does_not_open_the_dashboard(demo_client: AsyncClient) -> None:
    customer = {"channel": "phone", "destination": "01012345678", "code": "135790"}
    assert (await demo_client.post("/api/auth/verify", json=customer)).status_code == 200
    assert (await demo_client.get("/api/admin/auth/session")).json() == {"code": "signed_out"}
    assert (await demo_client.get("/api/admin/probe")).json() == {"code": "admin_required"}


async def test_the_demo_takes_any_lo2ma_test_email_and_any_code(demo_client: AsyncClient) -> None:
    started = await challenge(demo_client, "admin@lo2ma.test", "correct horse")
    response = await verify(demo_client, started, "482193")
    assert response.status_code == 200
    admin = response.json()
    assert (admin["name"], admin["email"]) == ("Lo2ma admin", "admin@lo2ma.test")
    assert (await demo_client.get("/api/admin/auth/session")).status_code == 200

    # The same email is the same admin the next time.
    started = await challenge(demo_client, "admin@lo2ma.test", "12345678")
    again = await verify(demo_client, started, "111111")
    assert again.json()["id"] == admin["id"]


async def test_the_demo_rejects_other_emails_short_passwords_and_its_wrong_code(
    demo_client: AsyncClient,
) -> None:
    for body in (
        {"email": "someone@example.com", "password": "correct horse"},
        {"email": "admin@lo2ma.test", "password": "short"},
    ):
        response = await demo_client.post("/api/admin/auth/sign-in", json=body)
        assert response.json() == {"code": "invalid_credentials"}
    started = await challenge(demo_client, "admin@lo2ma.test", "correct horse")
    wrong = await verify(demo_client, started, "000000")
    assert wrong.json() == {"code": "invalid_code"}


async def test_an_admin_the_demo_made_cannot_sign_in_without_the_demo(
    demo_client: AsyncClient, db_client: AsyncClient
) -> None:
    await challenge(demo_client, "admin@lo2ma.test", "correct horse")
    body = {"email": "admin@lo2ma.test", "password": "correct horse"}
    response = await db_client.post("/api/admin/auth/sign-in", json=body)
    assert response.json() == {"code": "invalid_credentials"}


async def test_a_new_admin_gets_a_hashed_password_and_an_authenticator_link(
    session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(pyotp, "random_base32", lambda: SECRET)
    admin, link = await service.create_admin(session, " Mona@Lo2ma.com ", "Mona", PASSWORD)
    assert admin.email == EMAIL
    assert admin.password_hash.startswith("$argon2id$")
    assert PASSWORD not in admin.password_hash
    assert link.startswith("otpauth://totp/Lo2ma:mona%40lo2ma.com?")
    assert f"secret={SECRET}" in link
    assert "issuer=Lo2ma" in link
