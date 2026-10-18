"""Speech to text for voice messages.

Phase 3 sends the audio to a speech-to-text model for Egyptian Arabic, chosen by evals. Until then
the demo hears the mock's sentence in any recording (backend/seed/voice.json), so the chat that
follows finds meals the same way on both.
"""

from functools import cache
from pathlib import Path
from typing import IO

from app.core.api_model import Locale, LocalizedText
from app.core.errors import DomainError
from app.domain.rules import VOICE_MAX_BYTES

SEED = Path(__file__).resolve().parents[3] / "seed" / "voice.json"


class AudioTooLargeError(DomainError):
    """Far more than a minute of speech."""

    status = 413
    code = "audio_too_large"


class NoSpeechError(DomainError):
    status = 422
    code = "no_speech"


@cache
def _demo_transcripts() -> LocalizedText:
    return LocalizedText.model_validate_json(SEED.read_bytes())


def transcribe(audio: IO[bytes], size: int, locale: Locale) -> str:
    """What was said in the recording. The demo hears the same sentence in any of them."""
    if size > VOICE_MAX_BYTES:
        raise AudioTooLargeError()
    if size == 0:
        raise NoSpeechError()
    del audio  # the model of phase 3 listens to it
    transcripts = _demo_transcripts()
    return transcripts.en if locale == "en" else transcripts.ar
