"""Time in one place: the API speaks "HH:mm" in Cairo, and the database stores moments in UTC."""

import re
from datetime import datetime
from zoneinfo import ZoneInfo

CAIRO = ZoneInfo("Africa/Cairo")

# TIME_24H in packages/core/src/time.ts. [0-9], not \d: in Python \d matches other scripts' digits.
_TIME_24H = re.compile(r"([01][0-9]|2[0-3]):([0-5][0-9])")


def _to_minutes(time: str) -> int:
    match = _TIME_24H.fullmatch(time)
    if match is None:
        raise ValueError(f'Expected a 24-hour "HH:mm" time, got {time!r}')
    return int(match[1]) * 60 + int(match[2])


def _from_minutes(total: int) -> str:
    wrapped = total % 1440  # Python's % already wraps negatives around midnight
    return f"{wrapped // 60:02d}:{wrapped % 60:02d}"


def add_minutes(time: str, minutes: int) -> str:
    """ "13:30" + -15 → "13:15". Wraps around midnight."""
    return _from_minutes(_to_minutes(time) + minutes)


def in_cairo(moment: datetime) -> datetime:
    """The same moment on Cairo's clock. A datetime without a timezone is no moment: refused."""
    if moment.utcoffset() is None:
        raise ValueError("A datetime without a timezone can't be placed in time")
    return moment.astimezone(CAIRO)


def time_of(moment: datetime) -> str:
    """The time of day in Cairo, as "HH:mm"."""
    local = in_cairo(moment)
    return f"{local.hour:02d}:{local.minute:02d}"
