"""Random tokens for cookies (a guest's, a session's). The database keeps only their SHA-256, so a
leaked table opens nothing."""

import hashlib
import secrets


def new_token() -> str:
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
