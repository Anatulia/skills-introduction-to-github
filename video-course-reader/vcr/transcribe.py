"""Trascrizione audio con timestamp.

Due motori intercambiabili:
  - "faster-whisper" (default): qualità migliore, ma scarica i modelli da
    HuggingFace. Ideale in locale o dove l'egress verso HF è consentito.
  - "sherpa": sherpa-onnx Whisper, con modelli ospitati su GitHub Releases.
    Funziona anche dietro proxy che bloccano HuggingFace (es. ambienti cloud
    con policy di rete restrittiva). Trascrive a blocchi di 30s (limite del
    Whisper offline di sherpa-onnx): i timestamp hanno granularità 30s.
"""
from __future__ import annotations

import os
import tarfile
import tempfile
import urllib.request
import wave
from dataclasses import dataclass

from .utils import require_tool, run

# Release pubblica di sherpa-onnx (host GitHub, consentito da policy comuni).
_SHERPA_BASE = (
    "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/"
    "sherpa-onnx-whisper-{size}.tar.bz2"
)


@dataclass
class Segment:
    start: float
    end: float
    text: str


def transcribe(
    video: str,
    engine: str = "faster-whisper",
    model_size: str = "medium",
    language: str | None = None,
    device: str = "auto",
    model_dir: str | None = None,
) -> list[Segment]:
    """Trascrive l'audio del video con il motore scelto."""
    if engine == "sherpa":
        return _transcribe_sherpa(
            video, size=model_size, language=language, model_dir=model_dir
        )
    return _transcribe_faster_whisper(
        video, model_size=model_size, language=language, device=device
    )


def _transcribe_faster_whisper(
    video: str, model_size: str, language: str | None, device: str
) -> list[Segment]:
    try:
        from faster_whisper import WhisperModel
    except ImportError as e:  # pragma: no cover
        raise RuntimeError(
            "faster-whisper non installato. Esegui: pip install faster-whisper"
        ) from e

    compute_type = "int8" if device in ("cpu", "auto") else "float16"
    model = WhisperModel(model_size, device=device, compute_type=compute_type)
    segments, _info = model.transcribe(video, language=language, vad_filter=True)
    return [
        Segment(start=s.start, end=s.end, text=s.text.strip())
        for s in segments
        if s.text.strip()
    ]


# --------------------------- motore sherpa-onnx --------------------------- #

def ensure_sherpa_model(size: str = "small", cache_dir: str | None = None) -> str:
    """Scarica (se serve) ed estrae il modello sherpa-onnx Whisper.

    Ritorna la cartella del modello. `size`: tiny|base|small|medium.
    """
    cache_dir = cache_dir or os.path.join(
        os.path.expanduser("~"), ".cache", "vcr", "sherpa"
    )
    os.makedirs(cache_dir, exist_ok=True)
    model_dir = os.path.join(cache_dir, f"sherpa-onnx-whisper-{size}")
    if os.path.exists(os.path.join(model_dir, f"{size}-encoder.int8.onnx")):
        return model_dir

    url = _SHERPA_BASE.format(size=size)
    tar_path = os.path.join(cache_dir, f"sherpa-onnx-whisper-{size}.tar.bz2")
    urllib.request.urlretrieve(url, tar_path)
    with tarfile.open(tar_path, "r:bz2") as tar:
        tar.extractall(cache_dir)
    os.remove(tar_path)
    return model_dir


def _extract_wav_16k_mono(video: str, wav_path: str) -> None:
    ffmpeg = require_tool("ffmpeg")
    run([ffmpeg, "-y", "-i", video, "-ac", "1", "-ar", "16000", "-f", "wav", wav_path])


def _transcribe_sherpa(
    video: str, size: str, language: str | None, model_dir: str | None
) -> list[Segment]:
    try:
        import numpy as np
        import sherpa_onnx
    except ImportError as e:  # pragma: no cover
        raise RuntimeError(
            "sherpa-onnx non installato. Esegui: pip install sherpa-onnx numpy"
        ) from e

    model_dir = model_dir or ensure_sherpa_model(size)
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=os.path.join(model_dir, f"{size}-encoder.int8.onnx"),
        decoder=os.path.join(model_dir, f"{size}-decoder.int8.onnx"),
        tokens=os.path.join(model_dir, f"{size}-tokens.txt"),
        language=language or "",
        task="transcribe",
    )

    with tempfile.TemporaryDirectory() as tmp:
        wav_path = os.path.join(tmp, "audio16k.wav")
        _extract_wav_16k_mono(video, wav_path)
        w = wave.open(wav_path, "rb")
        sr = w.getframerate()
        samples = (
            np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16)
            .astype(np.float32)
            / 32768.0
        )

    chunk = 30  # secondi: limite del Whisper offline di sherpa-onnx
    total = len(samples) / sr
    out: list[Segment] = []
    for start in range(0, int(total) + 1, chunk):
        a, b = int(start * sr), int(min((start + chunk) * sr, len(samples)))
        if b - a < sr * 0.5:
            break
        s = rec.create_stream()
        s.accept_waveform(sr, samples[a:b])
        rec.decode_stream(s)
        text = s.result.text.strip()
        if text:
            out.append(Segment(start=float(start), end=min(start + chunk, total), text=text))
    return out
