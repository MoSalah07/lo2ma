"""When each step of an order is expected, and where a planned day stands, by Cairo's clock.

The same rules as packages/core/src/orders.ts; tests/domain checks both give the same answers.
"""

from datetime import date, datetime
from typing import Literal, NamedTuple

from app.domain.clock import add_minutes, in_cairo, time_of
from app.domain.rules import (
    ORDER_STEP_MINUTES_ACCEPTED,
    ORDER_STEP_MINUTES_DELIVERED,
    ORDER_STEP_MINUTES_ON_THE_WAY,
    ORDER_STEP_MINUTES_PREPARING,
    ORDER_STEP_MINUTES_SENT,
)

OrderStatus = Literal["sent", "accepted", "preparing", "onTheWay", "delivered"]
PlanDayStatus = Literal["scheduled", "sent", "accepted", "preparing", "onTheWay", "delivered"]

# Minutes before arrival, in the steps' order (orderSteps in core; the vectors check the order).
_STEP_MINUTES: dict[OrderStatus, int] = {
    "sent": ORDER_STEP_MINUTES_SENT,
    "accepted": ORDER_STEP_MINUTES_ACCEPTED,
    "preparing": ORDER_STEP_MINUTES_PREPARING,
    "onTheWay": ORDER_STEP_MINUTES_ON_THE_WAY,
    "delivered": ORDER_STEP_MINUTES_DELIVERED,
}
_STEPS = list(_STEP_MINUTES)


class TimelineStep(NamedTuple):
    status: OrderStatus
    # "HH:mm" on Cairo's clock.
    at: str


def order_timeline(arrival_time: str) -> list[TimelineStep]:
    """The expected time of every step, for an order that should arrive at `arrival_time`."""
    return [
        TimelineStep(status, add_minutes(arrival_time, minutes))
        for status, minutes in _STEP_MINUTES.items()
    ]


def order_step_at(arrival_time: str, time: str) -> OrderStatus | None:
    """The step an order has reached by `time` on its day, or None before it is sent."""
    # Zero-padded "HH:mm" sorts like the times it holds.
    reached: list[OrderStatus] = [
        step.status for step in order_timeline(arrival_time) if step.at <= time
    ]
    return reached[-1] if reached else None


def shares_courier_phone(status: OrderStatus) -> bool:
    """The courier's number is shared once the order is on the way, never before."""
    return _STEPS.index(status) >= _STEPS.index("onTheWay")


def plan_day_status_at(day: date, now: datetime, arrival_time: str) -> PlanDayStatus:
    """Where a confirmed plan's day stands at `now`, on Cairo's calendar and clock: the days before
    are delivered, the days after are scheduled, and today follows its order once it goes out."""
    today = in_cairo(now).date()
    if day > today:
        return "scheduled"
    if day < today:
        return "delivered"
    return order_step_at(arrival_time, time_of(now)) or "scheduled"
