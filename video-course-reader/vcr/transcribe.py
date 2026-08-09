"""Trascrizione audio con timestamp.

Tre motori intercambiabili:
  - "faster-whisper" (default): gira in locale, scarica i modelli da
    HuggingFace. Qualità dipende dalla dimensione del modello.
  - "sherpa": sherpa-onnx Whisper, con modelli ospitati su GitHub Releases.
    Funziona anche dietro proxy che bloccano HuggingFace. Timestamp a 30s.
  - "openai": API OpenAI (whisper-1, verbose_json con timestamp per segmento).
    Qualità alta e veloce; richiede OPENAI_API_KEY. L'audio viene compresso e
    inviato a spezzoni al servizio (contenuti dell'utente, per uso personale).
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
    if engine == "openai":
        return _transcribe_openai(video, language=language, model=model_size)
    if engine == "sherpa":
        return _transcribe_sherpa(
            video, size=model_size, language=language, model_dir=model_dir
        )
    return _transcribe_faster_whisper(
        video, model_size=model_size, language=language, device=device
    )


# ----------------------------- motore OpenAI ------------------------------ #

def _load_openai_key() -> str:
    """Legge OPENAI_API_KEY dall'ambiente o da un file .env nella cwd o nella
    root del progetto. Ritorna la chiave o solleva un errore chiaro."""
    key = os.environ.get("OPENAI_API_KEY")
    if key:
        return key
    here = os.path.dirname(os.path.abspath(__file__))
    for env_path in (".env", os.path.join(here, "..", ".env")):
        try:
            for line in open(env_path):
                line = line.strip()
                if line.startswith("OPENAI_API_KEY="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
        except OSError:
            continue
    raise RuntimeError(
        "OPENAI_API_KEY non trovata. Impostala nell'ambiente o in un file .env."
    )


def _split_audio_chunks(video: str, out_dir: str, chunk_s: int = 900) -> list[str]:
    """Estrae l'audio in mp3 mono 16k e lo divide in spezzoni da `chunk_s`
    secondi (default 15 min: ben sotto il limite di 25 MB dell'API). Ritorna
    i path degli spezzoni in ordine."""
    ffmpeg = require_tool("ffmpeg")
    pattern = os.path.join(out_dir, "chunk_%04d.mp3")
    run([
        ffmpeg, "-y", "-i", video, "-vn", "-ac", "1", "-ar", "16000",
        "-c:a", "libmp3lame", "-q:a", "5",
        "-f", "segment", "-segment_time", str(chunk_s), pattern,
    ])
    return sorted(
        os.path.join(out_dir, f) for f in os.listdir(out_dir)
        if f.startswith("chunk_") and f.endswith(".mp3")
    )


# Esempio ben punteggiato: Whisper imita lo stile del prompt, quindi questo
# induce l'output a usare maiuscole e punteggiatura (altrimenti a volte
# restituisce testo tutto minuscolo e senza punti).
_PUNCT_PROMPT = {
    "it": ("Benvenuti in questa lezione. Oggi parliamo di business online, "
           "prodotti digitali e mindset. Vediamo insieme come funziona."),
    "en": ("Welcome to this lesson. Today we talk about online business, "
           "digital products and mindset. Let's see how it works."),
}


def _capitalize_sentences(text: str, cap_next: bool) -> tuple[str, bool]:
    """Rimette la maiuscola dopo . ! ? … (whisper-1 a volte lascia minuscolo
    l'inizio frase). `cap_next` è lo stato in ingresso (True se la frase deve
    iniziare in maiuscola): va mantenuto TRA i segmenti, perché un segmento
    può iniziare a metà frase. Ritorna (testo_corretto, cap_next_aggiornato)."""
    out = []
    for ch in text:
        if cap_next and ch.isalpha():
            out.append(ch.upper())
            cap_next = False
        else:
            out.append(ch)
        if ch in ".!?…":
            cap_next = True
    return "".join(out), cap_next


def _transcribe_openai(
    video: str, language: str | None, model: str = "whisper-1", chunk_s: int = 900
) -> list[Segment]:
    try:
        from openai import OpenAI
    except ImportError as e:  # pragma: no cover
        raise RuntimeError("openai non installato. Esegui: pip install openai") from e

    # whisper-1 è l'unico con timestamp per segmento (verbose_json).
    if model not in ("whisper-1",):
        model = "whisper-1"

    prompt = _PUNCT_PROMPT.get((language or "").lower())
    client = OpenAI(api_key=_load_openai_key())
    out: list[Segment] = []
    cap_next = True  # stato maiuscole mantenuto attraverso segmenti e spezzoni
    with tempfile.TemporaryDirectory() as tmp:
        chunks = _split_audio_chunks(video, tmp, chunk_s=chunk_s)
        for i, path in enumerate(chunks):
            offset = i * chunk_s
            with open(path, "rb") as f:
                resp = client.audio.transcriptions.create(
                    model=model, file=f, language=language or None,
                    response_format="verbose_json",
                    **({"prompt": prompt} if prompt else {}),
                )
            for seg in getattr(resp, "segments", None) or []:
                raw = (seg.text or "").strip()
                if not raw:
                    continue
                text, cap_next = _capitalize_sentences(raw, cap_next)
                out.append(Segment(
                    start=float(seg.start) + offset,
                    end=float(seg.end) + offset,
                    text=text,
                ))
    return out


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
