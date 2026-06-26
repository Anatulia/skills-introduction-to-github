"""Trascrizione audio con timestamp tramite faster-whisper (locale)."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Segment:
    start: float
    end: float
    text: str


def transcribe(
    video: str,
    model_size: str = "medium",
    language: str | None = None,
    device: str = "auto",
) -> list[Segment]:
    """Trascrive l'audio del video.

    `language=None` => autodetect. Per un webinar italiano passare "it".
    `model_size`: tiny|base|small|medium|large-v3 (qualità vs velocità).
    """
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:  # pragma: no cover
        raise RuntimeError(
            "faster-whisper non installato. Esegui: pip install faster-whisper"
        ) from e

    compute_type = "int8" if device in ("cpu", "auto") else "float16"
    model = WhisperModel(model_size, device=device, compute_type=compute_type)

    segments, _info = model.transcribe(
        video,
        language=language,
        vad_filter=True,  # rimuove silenzi, migliora i timestamp
    )
    return [
        Segment(start=s.start, end=s.end, text=s.text.strip())
        for s in segments
        if s.text.strip()
    ]
