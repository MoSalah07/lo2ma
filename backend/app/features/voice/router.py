from typing import Annotated

from fastapi import APIRouter, Form, UploadFile

from app.core.errors import invalid_input
from app.features.voice import service
from app.features.voice.schemas import Transcription

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/transcribe", openapi_extra=invalid_input("invalid_audio"))
async def transcribe(audio: UploadFile, locale: Annotated[str, Form()] = "ar") -> Transcription:
    """A voice message, written down for the user to check before sending.

    Multipart, as the browser records it: the `audio` file and the page's `locale`.
    """
    # Starlette counts the bytes as it reads the upload, into a temporary file past 1 MB.
    size = audio.size or 0
    text = service.transcribe(audio.file, size, "en" if locale == "en" else "ar")
    return Transcription(text=text)
