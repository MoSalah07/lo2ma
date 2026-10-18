import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.anyio


async def test_offers_the_demos_card_and_wallet(client: AsyncClient) -> None:
    response = await client.get("/api/payment-methods")
    assert response.status_code == 200
    # A wallet has no last four digits: the key is left out, never null.
    assert response.json() == [{"method": "card", "last4": "4821"}, {"method": "wallet"}]
