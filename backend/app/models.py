"""Every table, imported in one place: Alembic compares Base.metadata with the database, so a table
whose module was never imported would look deleted (migrations/env.py)."""

from app.core.db import Base
from app.features.auth.models import OtpCodeRecord, SessionRecord, UserRecord
from app.features.guests.models import GuestRecord
from app.features.places.models import PlaceRecord
from app.features.prefs.models import PrefsRecord

__all__ = [
    "Base",
    "GuestRecord",
    "OtpCodeRecord",
    "PlaceRecord",
    "PrefsRecord",
    "SessionRecord",
    "UserRecord",
]
