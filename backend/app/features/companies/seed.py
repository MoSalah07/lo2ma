"""The demo's companies from backend/seed/companies.json (written from the mock's data)."""

from pathlib import Path

from pydantic import TypeAdapter
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.companies.models import CompanyRecord
from app.features.companies.schemas import Company

SEED = Path(__file__).resolve().parents[3] / "seed" / "companies.json"


def load_companies() -> list[Company]:
    return TypeAdapter(list[Company]).validate_json(SEED.read_bytes())


async def seed_companies(session: AsyncSession, companies: list[Company]) -> None:
    """Writes the companies, inside the caller's transaction. Seeding again renames them."""
    statement = insert(CompanyRecord).values(
        [
            {"id": company.id, "name_ar": company.name.ar, "name_en": company.name.en}
            for company in companies
        ]
    )
    await session.execute(
        statement.on_conflict_do_update(
            index_elements=["id"],
            set_={"name_ar": statement.excluded.name_ar, "name_en": statement.excluded.name_en},
        )
    )
