"""When lunch arrives, when a planned day's order goes out, and until when that day can change.

The same rules as packages/core/src/rules.ts; tests/domain checks both give the same answers.
"""

from datetime import date, datetime

from app.domain.clock import add_minutes, in_cairo, time_of
from app.domain.rules import ARRIVAL_BUFFER_MINUTES, PLAN_CHANGE_CUTOFF, PLAN_SEND_LEAD_MINUTES


def arrival_time_for(break_time: str) -> str:
    """When lunch should arrive for a break: "13:30" → "13:15"."""
    return add_minutes(break_time, -ARRIVAL_BUFFER_MINUTES)


def plan_send_time_for(arrival_time: str) -> str:
    """When a planned day's order goes to the restaurant: "13:15" → "12:30"."""
    return add_minutes(arrival_time, -PLAN_SEND_LEAD_MINUTES)


def plan_change_deadline(send_time: str, cutoff: str = PLAN_CHANGE_CUTOFF) -> str:
    """The last moment a planned day can change: the cutoff, or earlier if its order goes first."""
    return min(send_time, cutoff)  # zero-padded "HH:mm" sorts like the times it holds


def can_change_plan_day(day: date, now: datetime, deadline: str = PLAN_CHANGE_CUTOFF) -> bool:
    """Whether a planned day can still be swapped at `now`, on Cairo's clock: any later day, or the
    same day before the deadline."""
    today = in_cairo(now).date()
    return day > today or (day == today and time_of(now) < deadline)
