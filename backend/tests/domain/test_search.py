import pytest

from app.domain.search import fold_for_search, search_words
from tests.vectors import load

VECTORS = load("search")


@pytest.mark.parametrize(("text", "expected"), VECTORS["fold_for_search"])
def test_folds_text_like_the_apps(text: str, expected: str) -> None:
    assert fold_for_search(text) == expected


@pytest.mark.parametrize(("query", "expected"), VECTORS["search_words"])
def test_splits_a_query_like_the_apps(query: str, expected: list[str]) -> None:
    assert search_words(query) == expected
