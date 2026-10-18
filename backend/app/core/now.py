"""The current moment, as a dependency: a test sets the clock by overriding `utc_now`."""

from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends


def utc_now() -> datetime:
    return datetime.now(UTC)


Now = Annotated[datetime, Depends(utc_now)]
