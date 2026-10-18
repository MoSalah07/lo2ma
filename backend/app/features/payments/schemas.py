from typing import Annotated, Literal

from pydantic import Field
from pydantic.json_schema import SkipJsonSchema

from app.core.api_model import ApiModel, omitted

PaymentMethod = Literal["card", "wallet"]


class SavedPaymentMethod(ApiModel):
    """A way to pay the user saved (savedPaymentMethodSchema)."""

    method: PaymentMethod
    # A card's last four digits.
    last4: Annotated[str, Field(pattern=r"^[0-9]{4}$")] | SkipJsonSchema[None] = omitted()
