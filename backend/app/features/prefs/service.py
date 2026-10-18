"""A guest's preferences: read them, and save them (making the guest on the first save)."""

from datetime import time
from uuid import UUID

from pydantic import TypeAdapter
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.api_model import GeoPoint, Ingredient, LocalizedText
from app.core.errors import DomainError
from app.domain.geo import is_in_service_area
from app.features.guests.service import create_guest, find_guest
from app.features.prefs.models import PrefsRecord
from app.features.prefs.schemas import (
    AnyCalories,
    AroundCalories,
    CaloriePref,
    FitCalories,
    UnderCalories,
    UserPrefs,
    Workplace,
)

# The database keeps exclusions to the ingredients (a CHECK); this turns them back into the type.
_INGREDIENTS = TypeAdapter(list[Ingredient])


class NotOnboardedError(DomainError):
    status = 404
    code = "not_onboarded"


class OutsideServiceAreaError(DomainError):
    """The point is a real one, but Lo2ma doesn't deliver there yet."""

    status = 422
    code = "outside_service_area"


def _calorie_columns(calories: CaloriePref) -> dict[str, object]:
    match calories:
        case AnyCalories():
            return {
                "calorie_mode": "any",
                "calorie_kcal": None,
                "fit_protein": None,
                "fit_goal": None,
            }
        case AroundCalories() | UnderCalories():
            kcal = calories.kcal
            return {
                "calorie_mode": calories.mode,
                "calorie_kcal": kcal,
                "fit_protein": None,
                "fit_goal": None,
            }
        case FitCalories():
            return {
                "calorie_mode": "fit",
                "calorie_kcal": calories.kcal,
                "fit_protein": calories.protein,
                "fit_goal": calories.goal,
            }


def _calories(record: PrefsRecord) -> CaloriePref:
    kcal, protein = record.calorie_kcal, record.fit_protein
    match record.calorie_mode:
        case "around" if kcal is not None:
            return AroundCalories(mode="around", kcal=kcal)
        case "under" if kcal is not None:
            return UnderCalories(mode="under", kcal=kcal)
        case "fit" if kcal is not None and protein is not None:
            return FitCalories.model_validate(
                {"mode": "fit", "goal": record.fit_goal, "kcal": kcal, "protein": protein}
            )
        case _:
            return AnyCalories(mode="any")


def _to_prefs(record: PrefsRecord) -> UserPrefs:
    return UserPrefs(
        workplace=Workplace(
            name=LocalizedText(ar=record.workplace_name_ar, en=record.workplace_name_en),
            area=LocalizedText(ar=record.workplace_area_ar, en=record.workplace_area_en),
            point=GeoPoint(lat=record.workplace_lat, lng=record.workplace_lng),
            details=record.workplace_details,
        ),
        break_time=record.break_time.strftime("%H:%M"),
        budget=record.budget,
        calories=_calories(record),
        exclusions=_INGREDIENTS.validate_python(record.exclusions),
    )


def _columns(prefs: UserPrefs) -> dict[str, object]:
    workplace = prefs.workplace
    return {
        "workplace_name_ar": workplace.name.ar,
        "workplace_name_en": workplace.name.en,
        "workplace_area_ar": workplace.area.ar,
        "workplace_area_en": workplace.area.en,
        "workplace_lat": workplace.point.lat,
        "workplace_lng": workplace.point.lng,
        "workplace_details": workplace.details,
        "break_time": time.fromisoformat(prefs.break_time),
        "budget": prefs.budget,
        **_calorie_columns(prefs.calories),
        "exclusions": list(prefs.exclusions),
    }


async def _find_prefs(
    session: AsyncSession, user_id: UUID | None, guest_token: str | None
) -> PrefsRecord | None:
    if user_id is not None:
        return await session.scalar(select(PrefsRecord).where(PrefsRecord.user_id == user_id))
    guest = await find_guest(session, guest_token)
    if guest is None:
        return None
    return await session.scalar(select(PrefsRecord).where(PrefsRecord.guest_id == guest.id))


async def load_prefs(
    session: AsyncSession, user_id: UUID | None, guest_token: str | None
) -> UserPrefs:
    """The signed-in user's preferences, or else this browser's guest's."""
    async with session.begin():
        record = await _find_prefs(session, user_id, guest_token)
    if record is None:
        raise NotOnboardedError()
    return _to_prefs(record)


async def save_prefs(
    session: AsyncSession, user_id: UUID | None, guest_token: str | None, prefs: UserPrefs
) -> tuple[UserPrefs, str | None]:
    """Saves them for the signed-in user, or else for this browser's guest, making the guest on its
    first save. Returns the new guest's token, when there is one.

    The area is checked first, so a refused save leaves nothing behind: no guest, no cookie.
    """
    if not is_in_service_area(prefs.workplace.point):
        raise OutsideServiceAreaError()
    values = _columns(prefs)
    new_token = None
    async with session.begin():
        if user_id is not None:
            owner, key = {"user_id": user_id}, "user_id"
        else:
            guest = await find_guest(session, guest_token)
            if guest is None:
                guest, new_token = await create_guest(session)
            owner, key = {"guest_id": guest.id}, "guest_id"
        upsert = insert(PrefsRecord).values(**owner, **values)
        await session.execute(
            upsert.on_conflict_do_update(
                index_elements=[key], set_={**values, "updated_at": func.now()}
            )
        )
    return prefs, new_token


async def copy_guest_prefs(session: AsyncSession, guest_token: str | None, user_id: UUID) -> None:
    """On signing in, inside the caller's transaction: a user who has no preferences takes this
    browser's guest's, so onboarding done before signing in is kept. The guest keeps its own, for
    this browser after signing out."""
    guest = await find_guest(session, guest_token)
    if guest is None:
        return
    record = await session.scalar(select(PrefsRecord).where(PrefsRecord.guest_id == guest.id))
    if record is None:
        return
    await session.execute(
        insert(PrefsRecord)
        .values(user_id=user_id, **_columns(_to_prefs(record)))
        .on_conflict_do_nothing(index_elements=["user_id"])
    )
