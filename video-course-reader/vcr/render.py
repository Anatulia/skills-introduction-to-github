"""Allineamento keyframe<->trascrizione e generazione output."""
from __future__ import annotations

import json
import os

from .transcribe import Segment
from .utils import Keyframe, fmt_ts


def align(keyframes: list[Keyframe], segments: list[Segment]) -> list[dict]:
    """Raggruppa la trascrizione sotto il keyframe attivo in quel momento.

    Ogni "sezione" = un keyframe + tutto il parlato finché non compare il
    keyframe successivo. È la struttura naturale di una slide di un corso.
    """
    if not keyframes:
        return [{
            "keyframe": None,
            "segments": segments,
        }]

    sections = [{"keyframe": kf, "segments": []} for kf in keyframes]
    boundaries = [kf.time for kf in keyframes]

    for seg in segments:
        # indice dell'ultimo keyframe il cui tempo <= inizio del segmento
        idx = 0
        for i, b in enumerate(boundaries):
            if b <= seg.start:
                idx = i
            else:
                break
        sections[idx]["segments"].append(seg)
    return sections


def to_markdown(sections: list[dict], title: str, frames_dir_rel: str) -> str:
    lines = [f"# {title}", ""]
    lines.append("> Documento generato automaticamente: trascrizione e "
                 "screenshot sincronizzati del video-corso.\n")
    for sec in sections:
        kf: Keyframe | None = sec["keyframe"]
        if kf is not None:
            rel = os.path.join(frames_dir_rel, os.path.basename(kf.image_path))
            lines.append(f"## [{fmt_ts(kf.time)}] Schermata {kf.index} "
                         f"_({kf.reason})_")
            lines.append("")
            lines.append(f"![Schermata {kf.index}]({rel})")
            lines.append("")
            if kf.description:
                lines.append(f"**Cosa mostra:** {kf.description}")
                lines.append("")
            if kf.ocr_text:
                lines.append(f"**Testo a schermo (OCR):** {kf.ocr_text}")
                lines.append("")
        speech = " ".join(s.text for s in sec["segments"]).strip()
        if speech:
            lines.append(f"> {speech}")
            lines.append("")
    return "\n".join(lines)


def to_json(sections: list[dict], title: str) -> str:
    payload = {"title": title, "sections": []}
    for sec in sections:
        kf: Keyframe | None = sec["keyframe"]
        payload["sections"].append({
            "keyframe": None if kf is None else {
                "index": kf.index,
                "time": kf.time,
                "timestamp": fmt_ts(kf.time),
                "image": os.path.basename(kf.image_path),
                "reason": kf.reason,
                "ocr_text": kf.ocr_text,
                "description": kf.description,
            },
            "transcript": [
                {"start": s.start, "end": s.end, "text": s.text}
                for s in sec["segments"]
            ],
        })
    return json.dumps(payload, ensure_ascii=False, indent=2)


def to_html(sections: list[dict], title: str, frames_dir_rel: str) -> str:
    parts = [
        "<!doctype html><html lang='it'><head><meta charset='utf-8'>",
        f"<title>{title}</title>",
        "<style>body{font-family:system-ui,sans-serif;max-width:820px;"
        "margin:2rem auto;padding:0 1rem;line-height:1.55}"
        "img{max-width:100%;border:1px solid #ddd;border-radius:8px}"
        ".ts{color:#888;font-weight:normal;font-size:.8em}"
        ".desc{background:#eef6ff;padding:.6rem .8rem;border-radius:6px}"
        ".ocr{color:#555;font-size:.9em}"
        "blockquote{border-left:3px solid #ccc;margin:.6rem 0;"
        "padding-left:.8rem;color:#222}</style></head><body>",
        f"<h1>{title}</h1>",
    ]
    for sec in sections:
        kf: Keyframe | None = sec["keyframe"]
        if kf is not None:
            rel = os.path.join(frames_dir_rel, os.path.basename(kf.image_path))
            parts.append(f"<h2>Schermata {kf.index} "
                         f"<span class='ts'>[{fmt_ts(kf.time)}] {kf.reason}</span></h2>")
            parts.append(f"<img src='{rel}' alt='Schermata {kf.index}'>")
            if kf.description:
                parts.append(f"<p class='desc'><b>Cosa mostra:</b> {kf.description}</p>")
            if kf.ocr_text:
                parts.append(f"<p class='ocr'><b>OCR:</b> {kf.ocr_text}</p>")
        speech = " ".join(s.text for s in sec["segments"]).strip()
        if speech:
            parts.append(f"<blockquote>{speech}</blockquote>")
    parts.append("</body></html>")
    return "\n".join(parts)
