from datetime import UTC, datetime

import pytest

from app.domain.clock import add_minutes, in_cairo, time_of
from tests.vectors import load

VECTORS = load("clock")


@pytest.mark.parametrize(("time", "minutes", "expected"), VECTORS["add_minutes"])
def test_adds_minutes_like_the_apps(time: str, minutes: int, expected: str) -> None:
    assert add_minutes(time, minutes) == expected


@pytest.mark.parametrize("time", ["1:30", "24:00", "13:60", "13:30:00", "١٣:٣٠"])
def test_refuses_what_is_not_hh_mm(time: str) -> None:
    with pytest.raises(ValueError, match="HH:mm"):
        add_minutes(time, 0)


def test_follows_cairo_summer_time() -> None:
    assert time_of(datetime(2026, 10, 20, 9, 0, tzinfo=UTC)) == "12:00"
    assert time_of(datetime(2026, 10, 30, 9, 0, tzinfo=UTC)) == "11:00"


def test_refuses_a_datetime_without_a_timezone() -> None:
    with pytest.raises(ValueError, match="timezone"):
        in_cairo(datetime(2026, 10, 20, 12, 0))  # noqa: DTZ001 -- naive on purpose
