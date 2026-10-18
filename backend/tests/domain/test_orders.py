from datetime import UTC, date, datetime, time

import pytest

from app.domain.clock import CAIRO
from app.domain.orders import (
    OrderStatus,
    order_step_at,
    order_timeline,
    plan_day_status_at,
    shares_courier_phone,
)
from tests.vectors import load

VECTORS = load("orders")


@pytest.mark.parametrize(("arrival", "expected"), VECTORS["order_timeline"])
def test_expects_each_step_before_the_order_arrives(
    arrival: str, expected: list[dict[str, str]]
) -> None:
    assert [step._asdict() for step in order_timeline(arrival)] == expected


@pytest.mark.parametrize(("arrival", "at", "expected"), VECTORS["order_step_at"])
def test_finds_the_step_an_order_has_reached(arrival: str, at: str, expected: str | None) -> None:
    assert order_step_at(arrival, at) == expected


@pytest.mark.parametrize(("status", "expected"), VECTORS["shares_courier_phone"])
def test_shares_the_courier_once_on_the_way(status: OrderStatus, expected: bool) -> None:
    assert shares_courier_phone(status) is expected


@pytest.mark.parametrize(
    ("day", "today", "at", "arrival", "expected"), VECTORS["plan_day_status_at"]
)
def test_places_a_planned_day_by_the_clock(
    day: str, today: str, at: str, arrival: str, expected: str
) -> None:
    now = datetime.combine(date.fromisoformat(today), time.fromisoformat(at), tzinfo=CAIRO)
    assert plan_day_status_at(date.fromisoformat(day), now, arrival) == expected


def test_reads_the_day_on_cairos_calendar() -> None:
    # 22:30 UTC on the 19th is already 01:30 on the 20th in Cairo: the 19th is delivered, the
    # 20th's order hasn't gone out yet.
    now = datetime(2026, 10, 19, 22, 30, tzinfo=UTC)
    assert plan_day_status_at(date(2026, 10, 19), now, "13:15") == "delivered"
    assert plan_day_status_at(date(2026, 10, 20), now, "13:15") == "scheduled"
