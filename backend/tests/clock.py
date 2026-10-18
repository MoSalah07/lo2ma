from datetime import datetime


class Clock:
    """The time the app sees in a test (it overrides `utc_now`). Move it by changing `now`."""

    def __init__(self, now: datetime) -> None:
        self.now = now

    def __call__(self) -> datetime:
        return self.now
