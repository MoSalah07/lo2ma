from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.features.companies.models import CompanyRecord
from app.features.companies.schemas import Company, to_company


async def list_companies(session: AsyncSession) -> list[Company]:
    # By id: the seed's order (c1…), as the mock lists them.
    async with session.begin():
        records = await session.scalars(select(CompanyRecord).order_by(CompanyRecord.id))
        return [to_company(record) for record in records]
