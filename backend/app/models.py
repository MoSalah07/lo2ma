"""Every table, imported in one place: Alembic compares Base.metadata with the database, so a table
whose module was never imported would look deleted (migrations/env.py)."""

from app.core.db import Base
from app.features.admin_auth.models import AdminChallengeRecord, AdminRecord, AdminSessionRecord
from app.features.auth.models import OtpCodeRecord, SessionRecord, UserRecord
from app.features.catalog.models import DishRecord, FoodRecord, RecipeLineRecord, RestaurantRecord
from app.features.companies.models import CompanyRecord
from app.features.coupons.models import CouponRecord
from app.features.guests.models import GuestRecord
from app.features.places.models import PlaceRecord
from app.features.prefs.models import PrefsRecord
from app.features.suggestions.models import DishReportRecord

__all__ = [
    "AdminChallengeRecord",
    "AdminRecord",
    "AdminSessionRecord",
    "Base",
    "CompanyRecord",
    "CouponRecord",
    "DishRecord",
    "DishReportRecord",
    "FoodRecord",
    "GuestRecord",
    "OtpCodeRecord",
    "PlaceRecord",
    "PrefsRecord",
    "RecipeLineRecord",
    "RestaurantRecord",
    "SessionRecord",
    "UserRecord",
]
