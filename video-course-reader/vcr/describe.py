"""Comprensione visiva dei keyframe: OCR locale + descrizione vision (Claude).

Entrambi i livelli sono OPZIONALI e degradano con eleganza:
  - se Tesseract non c'è  -> niente OCR (ocr_text resta vuoto)
  - se non c'è API key    -> niente descrizione vision (description resta vuoto)
La pipeline resta comunque utile: screenshot + trascrizione sincronizzati.
"""
from __future__ import annotations

import base64
import os

from .utils import Keyframe

# Prompt pensato per i video-corsi: indicazioni "clicca qui" e lettura grafici.
_VISION_PROMPT = (
    "Questa è una schermata estratta da un video-corso. Descrivila in modo "
    "conciso e utile per chi non può vedere il video. In particolare:\n"
    "- Se ci sono indicazioni visive (frecce, riquadri, evidenziazioni, "
    "cursori, cerchi) che mostrano DOVE cliccare o cosa guardare, indica "
    "con precisione l'elemento e la sua posizione.\n"
    "- Se c'è un grafico, tabella o diagramma, riassumi i dati e il messaggio "
    "principale.\n"
    "- Se è una slide di testo, riporta i punti chiave.\n"
    "Rispondi in italiano, massimo 4 frasi. Niente preamboli."
)


def run_ocr(image_path: str, lang: str = "ita") -> str:
    """OCR via pytesseract; stringa vuota se non disponibile."""
    return run_ocr_with_confidence(image_path, lang)[0]


def run_ocr_with_confidence(image_path: str, lang: str = "ita") -> tuple[str, float]:
    """OCR + confidenza media tesseract [0-100] (0.0 se non disponibile/vuoto).

    La confidenza è il segnale per capire se un frame ha testo/grafici
    importanti ma la risoluzione sorgente è troppo bassa per leggerli bene
    (vedi `needs_higher_res`): un frame decorativo (volto, foto) dà OCR
    vuoto; uno leggibile dà OCR lungo E confidenza alta; uno con testo
    piccolo su desktop compresso dà OCR lungo MA confidenza bassa.
    """
    try:
        import pytesseract
        from pytesseract import Output
        from PIL import Image
    except ImportError:
        return "", 0.0
    try:
        img = Image.open(image_path)
        data = pytesseract.image_to_data(img, lang=lang, output_type=Output.DICT)
    except Exception:
        # lingua non installata o altro: ritorna vuoto invece di rompere.
        return "", 0.0
    words = []
    confs = []
    for word, conf in zip(data.get("text", []), data.get("conf", [])):
        word = word.strip()
        if not word:
            continue
        words.append(word)
        try:
            c = float(conf)
        except (TypeError, ValueError):
            continue
        if c >= 0:
            confs.append(c)
    text = " ".join(words)
    avg_conf = sum(confs) / len(confs) if confs else 0.0
    return text, avg_conf


def needs_higher_res(kf, min_len: int = 30, max_conf: float = 70.0) -> bool:
    """True se il frame ha testo sostanzioso ma l'OCR è poco affidabile —
    segno che vale la pena ri-estrarlo a risoluzione più alta dalla fonte
    (vedi `vcr.upgrade`). Frame decorativi (OCR quasi vuoto) NON vengono
    segnalati: non ha senso spendere banda per un volto o una foto.
    """
    return len(kf.ocr_text) >= min_len and 0 < kf.ocr_confidence < max_conf


def _b64(path: str) -> str:
    with open(path, "rb") as f:
        return base64.standard_b64encode(f.read()).decode("ascii")


def describe_vision(image_path: str, model: str) -> str:
    """Descrizione vision via Claude; stringa vuota se non configurato."""
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return ""
    try:
        import anthropic
    except ImportError:
        return ""
    try:
        client = anthropic.Anthropic()
        msg = client.messages.create(
            model=model,
            max_tokens=400,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": _b64(image_path),
                        },
                    },
                    {"type": "text", "text": _VISION_PROMPT},
                ],
            }],
        )
        return "".join(b.text for b in msg.content if b.type == "text").strip()
    except Exception as e:  # pragma: no cover
        return f"[descrizione vision non disponibile: {e}]"


def annotate(
    keyframes: list[Keyframe],
    do_ocr: bool = True,
    do_vision: bool = True,
    ocr_lang: str = "ita",
    vision_model: str = "claude-sonnet-4-6",
    on_progress=None,
) -> None:
    """Arricchisce in-place ogni keyframe con ocr_text e description."""
    for kf in keyframes:
        if do_ocr:
            kf.ocr_text, kf.ocr_confidence = run_ocr_with_confidence(
                kf.image_path, lang=ocr_lang)
        if do_vision:
            kf.description = describe_vision(kf.image_path, model=vision_model)
        if on_progress:
            on_progress(kf)
