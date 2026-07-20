"""Ri-estrae a risoluzione più alta SOLO i frame che ne hanno bisogno.

Problema: il download di default (`vcr.download --height 720`) va benissimo
per slide/parlato, ma nelle lezioni con schermate di software (editor,
dashboard, browser) il testo piccolo della UI diventa illeggibile — non è
un problema di compressione JPEG, è che a 720p quei pixel non ci sono più.

Non ha senso alzare la risoluzione di TUTTI i frame: sprecherebbe banda su
volto/foto/decorazioni. Questo modulo:
  1. rilegge `corso.json` di una lezione già elaborata,
  2. usa la confidenza OCR (vedi `describe.needs_higher_res`) per capire
     quali frame hanno testo importante ma poco leggibile,
  3. in modalità `--apply`, per QUEI frame soli ri-scarica un singolo
     fotogramma alla risoluzione richiesta direttamente dalla sorgente HLS
     (serve l'URL della lezione + lo stesso profilo di login usato per
     `vcr.download`), rifà l'OCR e rigenera corso.md/corso.html/corso.json.

Uso:
    # stima costo senza toccare la rete (quanti frame verrebbero rifatti)
    python -m vcr.upgrade output/ --dry-run

    # applica per davvero
    python -m vcr.upgrade output/ --lesson-url "URL_LEZIONE" \
        --profile-dir profile --height 1080 --apply
"""
from __future__ import annotations

import json
import os

from .describe import needs_higher_res, run_ocr_with_confidence
from .transcribe import Segment
from .utils import Keyframe
from . import render


def _load_sections(lesson_dir: str) -> tuple[dict, list[dict]]:
    corso_json = os.path.join(lesson_dir, "corso.json")
    with open(corso_json, "r", encoding="utf-8") as f:
        payload = json.load(f)

    sections = []
    for sec in payload["sections"]:
        kfd = sec["keyframe"]
        kf = None
        if kfd is not None:
            kf = Keyframe(
                index=kfd["index"],
                time=kfd["time"],
                image_path=os.path.join(lesson_dir, "frames", kfd["image"]),
                reason=kfd["reason"],
                ocr_text=kfd.get("ocr_text", ""),
                ocr_confidence=kfd.get("ocr_confidence", 0.0),
                description=kfd.get("description", ""),
            )
        segments = [Segment(start=s["start"], end=s["end"], text=s["text"])
                    for s in sec["transcript"]]
        sections.append({"keyframe": kf, "segments": segments})
    return payload, sections


def _save_sections(lesson_dir: str, sections: list[dict], title: str) -> None:
    md = render.to_markdown(sections, title, "frames")
    html = render.to_html(sections, title, "frames")
    js = render.to_json(sections, title)
    with open(os.path.join(lesson_dir, "corso.md"), "w", encoding="utf-8") as f:
        f.write(md)
    with open(os.path.join(lesson_dir, "corso.html"), "w", encoding="utf-8") as f:
        f.write(html)
    with open(os.path.join(lesson_dir, "corso.json"), "w", encoding="utf-8") as f:
        f.write(js)


def find_candidates(
    lesson_dir: str, ocr_lang: str = "ita",
    min_len: int = 30, max_conf: float = 70.0,
) -> tuple[dict, list[dict], list[Keyframe]]:
    """Carica la lezione e ritorna (payload, sections, keyframe_da_rifare).

    Se `corso.json` è di una versione precedente (senza `ocr_confidence`),
    la calcola al volo ri-leggendo l'OCR sul frame già estratto — operazione
    locale, nessuna rete.
    """
    payload, sections = _load_sections(lesson_dir)
    candidates: list[Keyframe] = []
    for sec in sections:
        kf = sec["keyframe"]
        if kf is None:
            continue
        if kf.ocr_confidence == 0.0 and kf.ocr_text:
            # corso.json vecchio: ricalcola la confidenza in locale.
            kf.ocr_text, kf.ocr_confidence = run_ocr_with_confidence(
                kf.image_path, lang=ocr_lang)
        if needs_higher_res(kf, min_len=min_len, max_conf=max_conf):
            candidates.append(kf)
    return payload, sections, candidates


def upgrade_lesson(
    lesson_dir: str,
    lesson_url: str | None = None,
    profile_dir: str | None = None,
    height: int = 1080,
    ocr_lang: str = "ita",
    min_len: int = 30,
    max_conf: float = 70.0,
    apply: bool = False,
    log=print,
) -> dict:
    """Analizza (e opzionalmente corregge) i frame poco leggibili di una lezione.

    Ritorna un report: {"total": N, "candidates": N, "upgraded": N}.
    """
    payload, sections, candidates = find_candidates(
        lesson_dir, ocr_lang=ocr_lang, min_len=min_len, max_conf=max_conf)
    total = sum(1 for s in sections if s["keyframe"] is not None)
    log(f"{lesson_dir}: {total} frame totali, {len(candidates)} da rifare "
        f"a risoluzione più alta (testo lungo ma OCR poco affidabile).")
    for kf in candidates:
        log(f"  · frame {kf.index} t={kf.time:.0f}s conf={kf.ocr_confidence:.0f} "
            f"len={len(kf.ocr_text)}")

    report = {"total": total, "candidates": len(candidates), "upgraded": 0}
    if not apply or not candidates:
        return report

    if not lesson_url or not profile_dir:
        raise ValueError(
            "--apply richiede --lesson-url e --profile-dir "
            "(serve riaprire la lezione per un manifest HLS valido).")

    from .download import sniff_manifest, download_frame_hires

    log("Riapro la lezione per un manifest HLS valido…")
    manifest = sniff_manifest(lesson_url, profile_dir)
    if not manifest:
        raise RuntimeError("Nessun manifest HLS intercettato: la lezione non "
                            "usa lo streaming diretto (usa vcr.capture?).")

    for kf in candidates:
        tmp_path = kf.image_path + ".hires.jpg"
        download_frame_hires(manifest, kf.time, tmp_path, height=height)
        old_conf = kf.ocr_confidence
        new_text, new_conf = run_ocr_with_confidence(tmp_path, lang=ocr_lang)
        os.replace(tmp_path, kf.image_path)
        kf.ocr_text, kf.ocr_confidence = new_text, new_conf
        log(f"  · frame {kf.index}: confidenza {old_conf:.0f} → {new_conf:.0f}")
        report["upgraded"] += 1

    _save_sections(lesson_dir, sections, payload["title"])
    log(f"Rigenerato corso.md/corso.html/corso.json in {lesson_dir}")
    return report


def main(argv: list[str] | None = None) -> int:
    import argparse

    p = argparse.ArgumentParser(
        prog="vcr-upgrade",
        description="Ri-estrae ad alta risoluzione solo i frame di una "
                    "lezione già elaborata che l'OCR non riesce a leggere bene.",
    )
    p.add_argument("lesson_dir", help="Cartella output della lezione (con corso.json e frames/).")
    p.add_argument("--lesson-url", help="URL della lezione (richiesto con --apply).")
    p.add_argument("--profile-dir", help="Cartella profilo login persistente (richiesto con --apply).")
    p.add_argument("--height", type=int, default=1080, help="Altezza target per i frame da rifare (default 1080).")
    p.add_argument("--min-len", type=int, default=30, help="Lunghezza minima OCR per considerare un frame 'con testo importante'.")
    p.add_argument("--max-conf", type=float, default=70.0, help="Sotto questa confidenza media tesseract [0-100] il frame è candidato.")
    p.add_argument("--language", default="ita", help="Lingua tesseract (default ita).")
    p.add_argument("--apply", action="store_true", help="Applica per davvero (di default fa solo un dry-run/stima).")
    args = p.parse_args(argv)

    report = upgrade_lesson(
        args.lesson_dir, lesson_url=args.lesson_url, profile_dir=args.profile_dir,
        height=args.height, ocr_lang=args.language,
        min_len=args.min_len, max_conf=args.max_conf, apply=args.apply,
    )
    if not args.apply:
        print(f"\nDry-run: {report['candidates']}/{report['total']} frame verrebbero rifatti. "
              f"Rilancia con --apply --lesson-url ... --profile-dir ... per farlo davvero.")
    else:
        print(f"\nFatto: {report['upgraded']}/{report['candidates']} frame aggiornati.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
