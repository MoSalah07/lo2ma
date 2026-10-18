"""Every table, imported in one place: Alembic compares Base.metadata with the database, so a table
whose module was never imported would look deleted (migrations/env.py)."""

from app.core.db import Base
from app.features.places.models import PlaceRecord

__all__ = ["Base", "PlaceRecord"]
