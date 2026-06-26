"""Estrazione keyframe via ffmpeg con strategia ibrida scene-detection.

Strategia (la nostra scelta di design per i video-corsi):
  1. Trigger principale = cambio scena rilevato da ffmpeg (filtro `scene`).
  2. Gap MINIMO  -> due keyframe non possono distare meno di `min_gap`
                    (evita raffiche di frame durante animazioni/transizioni).
  3. Gap MASSIMO -> se una scena resta statica oltre `max_gap`, inseriamo
                    comunque un frame periodico (copre sezioni lunghe parlate
                    su una sola slide).
  4. Includiamo sempre il frame iniziale (t=0).
"""
from __future__ import annotations

import os
import re

from .utils import Keyframe, probe_duration, require_tool, run

_PTS_RE = re.compile(r"pts_time:(\d+(?:\.\d+)?)")


def detect_scene_times(video: str, threshold: float) -> list[float]:
    """Ritorna i timestamp (s) dei cambi scena rilevati da ffmpeg."""
    ffmpeg = require_tool("ffmpeg")
    # showinfo stampa su stderr una riga per ogni frame selezionato.
    proc = run(
        [
            ffmpeg, "-i", video,
            "-filter:v", f"select='gt(scene,{threshold})',showinfo",
            "-f", "null", "-",
        ],
        capture=True,
    )
    times = [float(m) for m in _PTS_RE.findall(proc.stderr)]
    return sorted(set(times))


def build_timeline(
    scene_times: list[float],
    duration: float,
    min_gap: float,
    max_gap: float,
) -> list[tuple[float, str]]:
    """Fonde scene-times + frame periodici applicando gap min/max.

    Ritorna lista di (timestamp, reason) ordinata.
    """
    result: list[tuple[float, str]] = [(0.0, "start")]

    def last_t() -> float:
        return result[-1][0]

    # 1) Aggiungi le scene rispettando il gap minimo.
    for t in scene_times:
        if t - last_t() >= min_gap:
            result.append((t, "scene"))

    # 2) Riempi i buchi più lunghi del gap massimo con frame periodici.
    filled: list[tuple[float, str]] = []
    for i, (t, reason) in enumerate(result):
        filled.append((t, reason))
        nxt = result[i + 1][0] if i + 1 < len(result) else duration
        gap = nxt - t
        if gap > max_gap:
            n = int(gap // max_gap)
            for k in range(1, n + 1):
                filled.append((t + k * max_gap, "periodic"))

    # Ordina, deduplica e taglia oltre la durata.
    seen: set[int] = set()
    timeline: list[tuple[float, str]] = []
    for t, reason in sorted(filled):
        if t >= duration:
            continue
        key = int(t * 10)  # dedup a 0.1s
        if key in seen:
            continue
        seen.add(key)
        timeline.append((round(t, 2), reason))
    return timeline


def extract_frame(video: str, t: float, out_path: str) -> None:
    """Estrae un singolo frame al tempo t."""
    ffmpeg = require_tool("ffmpeg")
    run([
        ffmpeg, "-y",
        "-ss", f"{t:.3f}", "-i", video,
        "-frames:v", "1", "-q:v", "2",
        out_path,
    ])


def extract_keyframes(
    video: str,
    out_dir: str,
    threshold: float = 0.30,
    min_gap: float = 4.0,
    max_gap: float = 60.0,
) -> list[Keyframe]:
    """Pipeline completa: rileva, costruisce la timeline ed estrae i frame."""
    os.makedirs(out_dir, exist_ok=True)
    duration = probe_duration(video)
    scene_times = detect_scene_times(video, threshold)
    timeline = build_timeline(scene_times, duration, min_gap, max_gap)

    keyframes: list[Keyframe] = []
    for i, (t, reason) in enumerate(timeline):
        img = os.path.join(out_dir, f"frame_{i:04d}.jpg")
        extract_frame(video, t, img)
        keyframes.append(Keyframe(index=i, time=t, image_path=img, reason=reason))
    return keyframes
