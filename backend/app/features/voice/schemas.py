from app.core.api_model import ApiModel


class Transcription(ApiModel):
    """What a voice message said (transcriptionSchema)."""

    text: str
