"""The transcribe part of apps/web/src/mocks/handlers/handlers.test.ts against the real API. No
database: a voice message is only written down, never kept."""

import json
from typing import Any

import pytest
from httpx import AsyncClient

from app.domain.rules import VOICE_MAX_BYTES
from app.features.voice.service import SEED

pytestmark = pytest.mark.anyio

DEMO = json.loads(SEED.read_text(encoding="utf-8"))


async def transcribe(client: AsyncClient, audio: bytes, locale: str = "ar") -> Any:
    """A voice message as the browser sends it: multipart, the audio file and the page language."""
    files = {"audio": ("voice", audio, "audio/webm")}
    return await client.post("/api/chat/transcribe", files=files, data={"locale": locale})


async def test_writes_down_what_was_said_in_the_pages_language(client: AsyncClient) -> None:
    for locale in ("ar", "en"):
        response = await transcribe(client, b"voice", locale)
        assert response.status_code == 200
        assert response.json() == {"text": DEMO[locale]}


async def test_an_unknown_language_is_heard_in_arabic(client: AsyncClient) -> None:
    assert (await transcribe(client, b"voice", "fr")).json() == {"text": DEMO["ar"]}


async def test_treats_an_empty_recording_as_silence(client: AsyncClient) -> None:
    response = await transcribe(client, b"")
    assert response.status_code == 422
    assert response.json() == {"code": "no_speech"}


async def test_refuses_a_recording_far_bigger_than_a_minute_of_speech(client: AsyncClient) -> None:
    assert (await transcribe(client, bytes(VOICE_MAX_BYTES))).status_code == 200
    response = await transcribe(client, bytes(VOICE_MAX_BYTES + 1))
    assert response.status_code == 413
    assert response.json() == {"code": "audio_too_large"}


async def test_a_request_without_audio_is_invalid_audio(client: AsyncClient) -> None:
    for response in (
        await client.post("/api/chat/transcribe", data={"locale": "ar"}),
        await client.post("/api/chat/transcribe", json={"audio": "voice"}),
    ):
        assert response.status_code == 400
        assert response.json() == {"code": "invalid_audio"}
