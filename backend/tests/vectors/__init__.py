"""The answers packages/core's TypeScript gives. `npm run export:python -w @lo2ma/core` writes them.

Each JSON file maps a function to its cases, and each case is [...arguments, answer].
"""

import json
from pathlib import Path
from typing import Any


def load(module: str) -> dict[str, list[list[Any]]]:
    path = Path(__file__).with_name(f"{module}.json")
    return json.loads(path.read_text(encoding="utf-8"))
