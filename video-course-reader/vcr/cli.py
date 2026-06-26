"""Interfaccia a riga di comando.

Esempio:
    python -m vcr lezione.mp4 -o output --language it
"""
from __future__ import annotations

import argparse
import sys

from .pipeline import Config, run


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="vcr",
        description="Trasforma un video-corso in un documento leggibile: "
                    "trascrizione + screenshot ai cambi scena + lettura visiva.",
    )
    p.add_argument("video", help="Path al file video locale (.mp4, .mkv, …).")
    p.add_argument("-o", "--out", default="output", help="Cartella di output.")
    p.add_argument("-t", "--title", default="Video-corso", help="Titolo del documento.")

    g = p.add_argument_group("keyframe (scene-detection ibrida)")
    g.add_argument("--scene-threshold", type=float, default=0.30,
                   help="Sensibilità cambio scena 0–1 (più basso = più frame).")
    g.add_argument("--min-gap", type=float, default=4.0,
                   help="Secondi minimi tra due screenshot (anti-duplicati).")
    g.add_argument("--max-gap", type=float, default=60.0,
                   help="Secondi massimi senza screenshot (copre slide statiche).")

    g = p.add_argument_group("trascrizione")
    g.add_argument("--whisper-model", default="medium",
                   help="tiny|base|small|medium|large-v3.")
    g.add_argument("--language", default=None,
                   help="Codice lingua (es. 'it'); default autodetect.")
    g.add_argument("--device", default="auto", help="auto|cpu|cuda.")

    g = p.add_argument_group("lettura visiva")
    g.add_argument("--no-ocr", action="store_true", help="Disattiva l'OCR.")
    g.add_argument("--no-vision", action="store_true",
                   help="Disattiva la descrizione vision (Claude).")
    g.add_argument("--ocr-lang", default="ita", help="Lingua Tesseract.")
    g.add_argument("--vision-model", default="claude-sonnet-4-6",
                   help="Modello Claude per la vision.")
    return p


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    cfg = Config(
        video=args.video,
        out_dir=args.out,
        title=args.title,
        scene_threshold=args.scene_threshold,
        min_gap=args.min_gap,
        max_gap=args.max_gap,
        whisper_model=args.whisper_model,
        language=args.language,
        device=args.device,
        do_ocr=not args.no_ocr,
        do_vision=not args.no_vision,
        ocr_lang=args.ocr_lang,
        vision_model=args.vision_model,
    )
    try:
        paths = run(cfg)
    except RuntimeError as e:
        print(f"ERRORE: {e}", file=sys.stderr)
        return 1
    print("\nFatto. File generati:")
    for k, v in paths.items():
        print(f"  {k:9s} {v}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
