"""A guest's preferences: read them, and save them (making the guest on the first save)."""

from datetime import time

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


async def load_prefs(session: AsyncSession, guest_token: str | None) -> UserPrefs:
    guest = await find_guest(session, guest_token)
    record = guest and await session.scalar(
        select(PrefsRecord).where(PrefsRecord.guest_id == guest.id)
    )
    if not record:
        raise NotOnboardedError()
    return _to_prefs(record)


async def save_prefs(
    session: AsyncSession, guest_token: str | None, prefs: UserPrefs
) -> tuple[UserPrefs, str | None]:
    """Saves them, and returns the new guest's token when this browser had none yet.

    The area is checked first, so a refused save leaves nothing behind: no guest, no cookie.
    """
    workplace = prefs.workplace
    if not is_in_service_area(workplace.point):
        raise OutsideServiceAreaError()
    values: dict[str, object] = {
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
    async with session.begin():
        guest = await find_guest(session, guest_token)
        new_token = None
        if guest is None:
            guest, new_token = await create_guest(session)
        upsert = insert(PrefsRecord).values(guest_id=guest.id, **values)
        await session.execute(
            upsert.on_conflict_do_update(
                index_elements=["guest_id"], set_={**values, "updated_at": func.now()}
            )
        )
    return prefs, new_token
