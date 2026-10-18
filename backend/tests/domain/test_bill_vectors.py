"""calculate_bill against packages/core's calculateBill.

The function, its Bill and its own tests are yours to write (learn/backend/01, the exercise). These
cases only check that it gives the apps' answers. They're skipped until app/domain/bill.py exists,
and expect the shape learn/backend/02 shows: calculate_bill(items=[BillItem(price=…, quantity=…)],
delivery=…, service=…) returning a Bill with food, delivery, service and total.
"""

from typing import Any

import pytest

from tests.vectors import load

bill = pytest.importorskip("app.domain.bill", reason="calculate_bill isn't written yet")
VECTORS = load("bill")


def run(items: list[dict[str, Any]], delivery: Any, service: Any) -> Any:
    lines = [bill.BillItem(**item) for item in items]
    return bill.calculate_bill(items=lines, delivery=delivery, service=service)


@pytest.mark.parametrize(("items", "delivery", "service", "expected"), VECTORS["calculate_bill"])
def test_gives_the_apps_bill(
    items: list[dict[str, Any]], delivery: int, service: int, expected: dict[str, int]
) -> None:
    result = run(items, delivery, service)
    fields = {"food", "delivery", "service", "total"}
    assert {field: getattr(result, field) for field in fields} == expected


@pytest.mark.parametrize(
    ("items", "delivery", "service", "error"), VECTORS["calculate_bill_refuses"]
)
def test_refuses_what_the_apps_refuse(
    items: list[dict[str, Any]], delivery: Any, service: Any, error: str
) -> None:
    # TypeScript's RangeError is Python's ValueError.
    assert error == "RangeError"
    with pytest.raises(ValueError):
        run(items, delivery, service)
