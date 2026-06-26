"""Orchestratore: collega keyframe, trascrizione, descrizione e render."""
from __future__ import annotations

import os
from dataclasses import dataclass

from . import describe, keyframes, render, transcribe


@dataclass
class Config:
    video: str
    out_dir: str
    # keyframes
    scene_threshold: float = 0.30
    min_gap: float = 4.0
    max_gap: float = 60.0
    # transcribe
    whisper_model: str = "medium"
    language: str | None = None
    device: str = "auto"
    # describe
    do_ocr: bool = True
    do_vision: bool = True
    ocr_lang: str = "ita"
    vision_model: str = "claude-sonnet-4-6"
    # output
    title: str = "Video-corso"


def run(cfg: Config, log=print) -> dict:
    os.makedirs(cfg.out_dir, exist_ok=True)
    frames_dir = os.path.join(cfg.out_dir, "frames")

    log("1/4  Estrazione keyframe (scene-detection ibrida)…")
    kfs = keyframes.extract_keyframes(
        cfg.video, frames_dir,
        threshold=cfg.scene_threshold,
        min_gap=cfg.min_gap, max_gap=cfg.max_gap,
    )
    log(f"      → {len(kfs)} screenshot estratti.")

    log("2/4  Trascrizione audio (faster-whisper)…")
    segments = transcribe.transcribe(
        cfg.video, model_size=cfg.whisper_model,
        language=cfg.language, device=cfg.device,
    )
    log(f"      → {len(segments)} segmenti di parlato.")

    log("3/4  Lettura visiva dei keyframe (OCR + vision)…")
    describe.annotate(
        kfs, do_ocr=cfg.do_ocr, do_vision=cfg.do_vision,
        ocr_lang=cfg.ocr_lang, vision_model=cfg.vision_model,
        on_progress=lambda kf: log(f"      · schermata {kf.index} annotata"),
    )

    log("4/4  Allineamento e generazione output…")
    sections = render.align(kfs, segments)

    md = render.to_markdown(sections, cfg.title, "frames")
    html = render.to_html(sections, cfg.title, "frames")
    js = render.to_json(sections, cfg.title)

    paths = {
        "markdown": os.path.join(cfg.out_dir, "corso.md"),
        "html": os.path.join(cfg.out_dir, "corso.html"),
        "json": os.path.join(cfg.out_dir, "corso.json"),
    }
    with open(paths["markdown"], "w", encoding="utf-8") as f:
        f.write(md)
    with open(paths["html"], "w", encoding="utf-8") as f:
        f.write(html)
    with open(paths["json"], "w", encoding="utf-8") as f:
        f.write(js)

    log(f"      → output in {cfg.out_dir}")
    return paths
