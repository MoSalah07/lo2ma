from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class Health(BaseModel):
    status: Literal["ok"] = "ok"


@router.get("/health", include_in_schema=False)
async def health() -> Health:
    """For the host's health check: the process is up and serving.

    It leaves the database alone, so a check every few seconds never keeps a sleeping one awake.
    """
    return Health()
