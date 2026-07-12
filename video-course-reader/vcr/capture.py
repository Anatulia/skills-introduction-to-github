"""Cattura di un replay che gira solo nel browser (es. WebinarJam).

Idea: quando un corso NON è scaricabile (stream protetto, player in iframe),
la via robusta è *registrare la scheda del browser* mentre il replay è in
play, ottenendo un video che poi la pipeline `vcr` elabora normalmente.

IMPORTANTE — dove si esegue:
  Deve girare dove (a) il sito è raggiungibile dalla rete e (b) sei loggato.
  Tipicamente il TUO computer (Mac). NON funziona in ambienti la cui policy
  di rete blocca l'host del corso.

Login senza consegnare credenziali a nessuno:
  1. Esegui una volta con --login: si apre un browser vero, fai il login a
     mano, poi premi Invio nel terminale. Lo stato (cookie) viene salvato in
     --storage-state. Le credenziali le digiti solo tu, restano sul tuo PC.
  2. Le esecuzioni successive riusano quello stato: niente più login.
"""
from __future__ import annotations

import glob
import os
import time


def _find_chromium() -> str | None:
    """Trova un binario Chromium preinstallato (utile quando le versioni dei
    browser Playwright non combaciano con quella del pacchetto pip)."""
    env = os.environ.get("VCR_CHROMIUM") or os.environ.get("PLAYWRIGHT_CHROMIUM")
    if env and os.path.exists(env):
        return env
    root = os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "/opt/pw-browsers")
    for pat in (
        f"{root}/chromium-*/chrome-linux/chrome",
        f"{root}/chromium-*/chrome-linux/headless_shell",
    ):
        hits = sorted(glob.glob(pat))
        if hits:
            return hits[-1]
    return None


def _launch(p, headless: bool):
    exe = _find_chromium()
    kwargs = {"headless": headless}
    if exe:
        kwargs["executable_path"] = exe
    return p.chromium.launch(**kwargs)


def login_and_save_state(url: str, storage_state: str) -> None:
    """Apre un browser visibile per il login manuale e salva lo stato."""
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = _launch(p, headless=False)
        context = browser.new_context()
        page = context.new_page()
        page.goto(url, wait_until="domcontentloaded")
        input(
            "\n>> Fai il login nel browser aperto, avvia pure il replay se vuoi, "
            "poi torna qui e premi INVIO per salvare la sessione... "
        )
        context.storage_state(path=storage_state)
        browser.close()
    print(f"Stato salvato in {storage_state}")


def capture_replay(
    url: str,
    out_video: str,
    duration: float,
    storage_state: str | None = None,
    width: int = 1280,
    height: int = 720,
    play_selectors: tuple[str, ...] = (
        "button[aria-label*='play' i]",
        ".vjs-big-play-button",
        "button.play",
        "video",
    ),
    headless: bool = True,
) -> str:
    """Registra `duration` secondi del replay in un file video (webm).

    Ritorna il path del video prodotto. Il file webm è direttamente
    utilizzabile da `vcr` (ffmpeg lo legge senza problemi).
    """
    from playwright.sync_api import sync_playwright

    out_dir = os.path.dirname(os.path.abspath(out_video)) or "."
    os.makedirs(out_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = _launch(p, headless=headless)
        context = browser.new_context(
            storage_state=storage_state if storage_state and os.path.exists(storage_state) else None,
            viewport={"width": width, "height": height},
            record_video_dir=out_dir,
            record_video_size={"width": width, "height": height},
        )
        page = context.new_page()
        page.goto(url, wait_until="domcontentloaded")

        # Prova ad avviare la riproduzione.
        for sel in play_selectors:
            try:
                el = page.query_selector(sel)
                if el:
                    el.click(timeout=2000)
                    break
            except Exception:
                continue
        # Fallback: forza play su tutti i <video>.
        try:
            page.eval_on_selector_all(
                "video", "els => els.forEach(v => { v.muted=false; v.play&&v.play(); })"
            )
        except Exception:
            pass

        time.sleep(duration)

        video = page.video
        context.close()  # finalizza la registrazione
        browser.close()
        src = video.path() if video else None

    if not src or not os.path.exists(src):
        raise RuntimeError("Registrazione non prodotta: controlla URL/login/selettori.")
    if os.path.abspath(src) != os.path.abspath(out_video):
        os.replace(src, out_video)
    return out_video


def main(argv: list[str] | None = None) -> int:
    import argparse

    p = argparse.ArgumentParser(
        prog="vcr-capture",
        description="Registra un replay che gira nel browser in un file video. "
                    "Eseguire dove il sito è raggiungibile e sei loggato (il tuo PC).",
    )
    p.add_argument("url", help="URL del replay/corso.")
    p.add_argument("-o", "--out", default="capture.webm", help="Video di output (.webm).")
    p.add_argument("-d", "--duration", type=float, default=60,
                   help="Secondi da registrare (per un test tienilo basso).")
    p.add_argument("--storage-state", default=None,
                   help="File JSON con la sessione loggata (vedi --login).")
    p.add_argument("--login", action="store_true",
                   help="Apre un browser visibile per il login manuale e salva "
                        "lo stato in --storage-state, poi esce.")
    p.add_argument("--show", action="store_true", help="Browser visibile (non headless).")
    args = p.parse_args(argv)

    if args.login:
        if not args.storage_state:
            print("ERRORE: --login richiede --storage-state PATH", flush=True)
            return 2
        login_and_save_state(args.url, args.storage_state)
        return 0

    out = capture_replay(
        args.url, args.out, duration=args.duration,
        storage_state=args.storage_state, headless=not args.show,
    )
    print(f"Registrato: {out}")
    print(f"Ora elaboralo:  python -m vcr {out} -o output --language it")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
