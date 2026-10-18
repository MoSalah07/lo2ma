"""Payments come in phase 4 (a provider, saved cards, webhooks). Until then, the demo's methods."""

from functools import cache
from pathlib import Path

from fastapi import APIRouter
from pydantic import TypeAdapter

from app.features.payments.schemas import SavedPaymentMethod

SEED = Path(__file__).resolve().parents[3] / "seed" / "payment-methods.json"

router = APIRouter(prefix="/payment-methods", tags=["payments"])


@cache
def _demo_methods() -> list[SavedPaymentMethod]:
    return TypeAdapter(list[SavedPaymentMethod]).validate_json(SEED.read_bytes())


@router.get("")
async def list_payment_methods() -> list[SavedPaymentMethod]:
    """The mock's card and wallet, for everyone: nothing is saved before phase 4."""
    return _demo_methods()
