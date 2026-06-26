"""Utility condivise: wrapper ffmpeg/ffprobe e formattazione timestamp."""
from __future__ import annotations

import shutil
import subprocess
from dataclasses import dataclass


def require_tool(name: str) -> str:
    """Ritorna il path dell'eseguibile o solleva un errore chiaro."""
    path = shutil.which(name)
    if not path:
        raise RuntimeError(
            f"'{name}' non trovato nel PATH. Installalo prima di procedere "
            f"(es. `apt-get install ffmpeg` per ffmpeg/ffprobe)."
        )
    return path


def run(cmd: list[str], capture: bool = True) -> subprocess.CompletedProcess:
    """Esegue un comando e ritorna il risultato; stderr sempre catturato."""
    return subprocess.run(
        cmd,
        check=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE,
        text=True,
    )


def probe_duration(video: str) -> float:
    """Durata del video in secondi via ffprobe."""
    ffprobe = require_tool("ffprobe")
    out = run([
        ffprobe, "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        video,
    ]).stdout.strip()
    try:
        return float(out)
    except ValueError:
        raise RuntimeError(f"Impossibile leggere la durata di {video!r}: {out!r}")


def fmt_ts(seconds: float) -> str:
    """Formatta i secondi come HH:MM:SS."""
    s = int(round(seconds))
    h, rem = divmod(s, 3600)
    m, sec = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{sec:02d}"


@dataclass
class Keyframe:
    index: int
    time: float          # secondi
    image_path: str      # path al file estratto
    reason: str          # "scene" | "periodic" | "start"
    ocr_text: str = ""
    description: str = ""
