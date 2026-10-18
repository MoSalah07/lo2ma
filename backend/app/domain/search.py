"""Text folded the way people type it, for search.

The same rules as packages/core/src/search.ts; tests/domain checks both give the same answers.
"""

import re

# Arabic marks people skip when typing (harakat, the dagger alef) and the tatweel that stretches
# words. Written as code points: most of them are invisible on their own.
_MARKS = re.compile("[\u064b-\u0670\u0640]")
# Alef with hamza above or below, with madda, and wasla.
_ALEF_FORMS = re.compile("[\u0623\u0625\u0622\u0671]")
_ALEF = "\u0627"
_ALEF_MAKSURA, _YA = "\u0649", "\u064a"
_TA_MARBUTA, _HA = "\u0629", "\u0647"


def fold_for_search(text: str) -> str:
    """Lower case, no harakat or tatweel, every alef the same, alef maksura as ya, ta marbuta as ha.

    So «القريه الذكيه» and «القرية الذكية» fold to the same text.
    """
    folded = _ALEF_FORMS.sub(_ALEF, _MARKS.sub("", text.lower()))
    return folded.replace(_ALEF_MAKSURA, _YA).replace(_TA_MARBUTA, _HA)


def search_words(query: str) -> list[str]:
    """The words of a search query, folded. Every one of them must be found."""
    return fold_for_search(query).split()
