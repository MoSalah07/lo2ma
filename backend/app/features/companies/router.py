from fastapi import APIRouter, Depends

from app.core.db import SessionDep
from app.features.admin_auth.deps import required_admin
from app.features.companies import service
from app.features.companies.schemas import Company

router = APIRouter(
    prefix="/admin/companies", tags=["admin"], dependencies=[Depends(required_admin)]
)


@router.get("")
async def list_companies(session: SessionDep) -> list[Company]:
    """Every company, for the dashboard's filters and the coupon form."""
    return await service.list_companies(session)
