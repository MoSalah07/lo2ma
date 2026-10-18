from datetime import date, datetime

import pytest

from app.domain.timing import (
    arrival_time_for,
    can_change_plan_day,
    plan_change_deadline,
    plan_send_time_for,
)
from tests.vectors import load

VECTORS = load("timing")


@pytest.mark.parametrize(("break_time", "expected"), VECTORS["arrival_time_for"])
def test_lunch_arrives_before_the_break(break_time: str, expected: str) -> None:
    assert arrival_time_for(break_time) == expected


@pytest.mark.parametrize(("arrival", "expected"), VECTORS["plan_send_time_for"])
def test_a_planned_order_goes_out_before_it_should_arrive(arrival: str, expected: str) -> None:
    assert plan_send_time_for(arrival) == expected


@pytest.mark.parametrize(("send_time", "cutoff", "expected"), VECTORS["plan_change_deadline"])
def test_the_deadline_is_the_earlier_of_cutoff_and_send_time(
    send_time: str, cutoff: str, expected: str
) -> None:
    assert plan_change_deadline(send_time, cutoff) == expected


@pytest.mark.parametrize(("day", "now", "deadline", "expected"), VECTORS["can_change_plan_day"])
def test_a_day_can_change_until_its_deadline_in_cairo(
    day: str, now: str, deadline: str, expected: bool
) -> None:
    assert can_change_plan_day(date.fromisoformat(day), datetime.fromisoformat(now), deadline) is (
        expected
    )
