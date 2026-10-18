import pytest

from app.domain.phone import normalize_egypt_mobile
from tests.vectors import load

VECTORS = load("phone")


@pytest.mark.parametrize(("typed", "expected"), VECTORS["normalize_egypt_mobile"])
def test_reads_a_mobile_number_like_the_apps(typed: str, expected: str | None) -> None:
    assert normalize_egypt_mobile(typed) == expected


def test_ignores_digits_from_other_scripts() -> None:
    # Python's \d matches these Devanagari digits; the apps' (and so ours) don't.
    assert normalize_egypt_mobile("०१०१२३४५६७८") is None
