"""Egyptian mobile numbers, the way people type them.

The same rules as packages/core/src/phone.ts; tests/domain checks both give the same answers.
"""

import re

# Arabic-Indic (U+0660 to U+0669) and Persian (U+06F0 to U+06F9) digits. Both blocks start at a
# multiple of 16, so the code point % 16 is the digit.
_EASTERN_DIGITS = {
    code: str(code % 16) for start in (0x0660, 0x06F0) for code in range(start, start + 10)
}

# [0-9], not \d, which in Python also matches other scripts' digits.
_EGYPT_MOBILE = re.compile(r"1[0125][0-9]{8}")


def to_latin_digits(text: str) -> str:
    """«٢٨» → "28"."""
    return text.translate(_EASTERN_DIGITS)


def normalize_egypt_mobile(text: str) -> str | None:
    """What a user typed as a national Egyptian mobile number (10 digits, no leading 0), or None.

    Takes "010 1234 5678", "+20 10 1234 5678", "1012345678" and Arabic-Indic digits.
    """
    digits = re.sub(r"[^0-9]", "", to_latin_digits(text))
    national = re.sub(r"^0", "", re.sub(r"^(0020|20)", "", digits))
    return national if _EGYPT_MOBILE.fullmatch(national) else None
