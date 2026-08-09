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

Audio:
  La registrazione video di Playwright cattura solo i fotogrammi, mai
  l'audio. Per avere anche l'audio serve un dispositivo di loopback (es.
  BlackHole su macOS) impostato come Uscita audio di sistema; questo modulo
  lo cattura in parallelo con `ffmpeg`/avfoundation e lo unisce al video a
  fine registrazione. Se non viene trovato nessun dispositivo di loopback,
  la registrazione prosegue senza audio (comportamento precedente).
"""
from __future__ import annotations

import glob
import os
import subprocess
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


_LAUNCH_ARGS = [
    # Su macOS, con l'audio service nel proprio processo sandboxato
    # Chromium a volte non riesce ad aprire il device CoreAudio reale
    # (l'audio "suona" secondo la pagina ma non esce mai davvero).
    # Tenerlo nel processo principale risolve.
    "--disable-features=AudioServiceOutOfProcess",
    "--autoplay-policy=no-user-gesture-required",
]


def _launch(p, headless: bool):
    exe = _find_chromium()
    kwargs = {"headless": headless, "args": list(_LAUNCH_ARGS)}
    if exe:
        kwargs["executable_path"] = exe
    return p.chromium.launch(**kwargs)


def _launch_persistent(p, profile_dir: str, headless: bool, **context_kwargs):
    """Apre un contesto con profilo su disco: il login fatto una volta lì
    dentro resta valido tra le esecuzioni (cookie e token si auto-rinnovano
    come in un browser normale, a differenza dello snapshot storage_state)."""
    exe = _find_chromium()
    kwargs = {"headless": headless, "args": list(_LAUNCH_ARGS), **context_kwargs}
    if exe:
        kwargs["executable_path"] = exe
    return p.chromium.launch_persistent_context(profile_dir, **kwargs)


def _find_audio_device(name_substr: str = "BlackHole") -> str | None:
    """Cerca un dispositivo audio avfoundation il cui nome contiene
    `name_substr` (es. il loopback BlackHole) e ne ritorna l'indice."""
    try:
        proc = subprocess.run(
            ["ffmpeg", "-f", "avfoundation", "-list_devices", "true", "-i", ""],
            capture_output=True, text=True, timeout=15,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return None
    import re

    in_audio_section = False
    for line in proc.stderr.splitlines():
        if "AVFoundation audio devices" in line:
            in_audio_section = True
            continue
        if in_audio_section and name_substr.lower() in line.lower():
            m = re.search(r"\[(\d+)\]", line)
            if m:
                return m.group(1)
    return None


def _start_audio_capture(audio_path: str, device_index: str, duration: float):
    """Avvia in background la cattura audio dal dispositivo avfoundation
    indicato (file .wav grezzo). Ritorna il Popen, o None se ffmpeg non è
    disponibile."""
    try:
        return subprocess.Popen(
            [
                "ffmpeg", "-y", "-f", "avfoundation", "-i", f":{device_index}",
                "-t", str(duration), "-c:a", "pcm_s16le", audio_path,
            ],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
    except FileNotFoundError:
        return None


def _mux_video_audio(video_path: str, audio_path: str, out_path: str) -> bool:
    """Unisce video e audio in `out_path` (.webm, audio Opus). Ritorna True
    se riuscito."""
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-y", "-i", video_path, "-i", audio_path,
                "-c:v", "copy", "-c:a", "libopus", "-shortest", out_path,
            ],
            capture_output=True, timeout=120,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False
    return result.returncode == 0 and os.path.exists(out_path)


def _ensure_logged_in(page, url: str) -> None:
    """Se la piattaforma ha rediretto alla pagina di login, prova il re-login
    automatico cliccando il submit del modulo, che il password manager del
    profilo persistente precompila da solo (le credenziali le ha salvate
    l'utente nel browser al primo login; qui non vengono mai lette né scritte).
    """
    if "fcom_action=auth" not in page.url:
        return
    btn = page.query_selector("button:has-text('Accedi'), input[type=submit]")
    if not btn:
        print("Avviso: pagina di login senza modulo precompilato riconoscibile; "
              "serve un login manuale (--login).", flush=True)
        return
    print("Sessione scaduta: re-login automatico dal modulo precompilato…", flush=True)
    btn.click()
    page.wait_for_timeout(8000)
    if "fcom_action=auth" in page.url:
        # il redirect automatico non è scattato: riprova ad aprire la lezione
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_timeout(4000)


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


def login_persistent(url: str, profile_dir: str) -> None:
    """Apre un browser visibile con profilo su disco per il login manuale.

    A differenza di login_and_save_state, il login resta valido tra le
    esecuzioni finché la piattaforma non lo revoca (i token si rinnovano
    da soli come in un browser normale): di norma non va più ripetuto.
    """
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        context = _launch_persistent(p, profile_dir, headless=False)
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(url, wait_until="domcontentloaded")
        input(
            "\n>> Fai il login nel browser aperto (una volta sola: resterà "
            "memorizzato), poi torna qui e premi INVIO... "
        )
        context.close()
    print(f"Profilo salvato in {profile_dir}: il login verrà riusato automaticamente.")


def capture_replay(
    url: str,
    out_video: str,
    duration: float,
    storage_state: str | None = None,
    profile_dir: str | None = None,
    width: int = 1280,
    height: int = 720,
    play_selectors: tuple[str, ...] = (
        "button[data-plyr='play']",       # Plyr (es. embed Bunny Stream) — indipendente dalla lingua
        ".plyr__control--overlaid",
        "button[aria-label*='play' i]",   # variante inglese
        ".vjs-big-play-button",           # video.js
        "button.play",
        "video",
    ),
    headless: bool = True,
    audio_device: str | None = "auto",
) -> str:
    """Registra `duration` secondi del replay in un file video (webm).

    Se `audio_device` è "auto" (default), cerca un dispositivo di loopback
    (BlackHole) e cattura anche l'audio in parallelo, unendolo al video a
    fine registrazione. Passa un indice avfoundation per forzare un
    dispositivo specifico, o None per disattivare la cattura audio.

    Ritorna il path del video prodotto. Il file webm è direttamente
    utilizzabile da `vcr` (ffmpeg lo legge senza problemi).
    """
    from playwright.sync_api import sync_playwright

    out_dir = os.path.dirname(os.path.abspath(out_video)) or "."
    os.makedirs(out_dir, exist_ok=True)

    if audio_device == "auto":
        audio_device = _find_audio_device()
    if audio_device and headless:
        # Chromium headless non emette audio sul dispositivo di sistema:
        # per catturare l'audio serve la finestra visibile.
        print("Audio attivo: passo a browser visibile (headless non emette audio).",
              flush=True)
        headless = False
    audio_tmp = os.path.join(out_dir, "_capture_audio_tmp.wav")
    audio_proc = _start_audio_capture(audio_tmp, audio_device, duration) if audio_device else None

    with sync_playwright() as p:
        record_opts = {
            "viewport": {"width": width, "height": height},
            "record_video_dir": out_dir,
            "record_video_size": {"width": width, "height": height},
        }
        if profile_dir:
            browser = None
            context = _launch_persistent(p, profile_dir, headless=headless, **record_opts)
        else:
            browser = _launch(p, headless=headless)
            context = browser.new_context(
                storage_state=storage_state if storage_state and os.path.exists(storage_state) else None,
                **record_opts,
            )
        page = context.new_page()
        page.goto(url, wait_until="domcontentloaded")
        page.wait_for_timeout(4000)  # tempo per caricare eventuali player in iframe
        _ensure_logged_in(page, url)

        # Il player può essere nella pagina principale o in un iframe (es.
        # embed Bunny Stream/Vimeo/Wistia): prova su tutti i frame.
        for fr in page.frames:
            for sel in play_selectors:
                try:
                    el = fr.query_selector(sel)
                    if el:
                        el.click(timeout=2000)
                        break
                except Exception:
                    continue
            # Fallback: forza play su tutti i <video> del frame.
            try:
                fr.eval_on_selector_all(
                    "video", "els => els.forEach(v => { v.muted=false; v.play&&v.play(); })"
                )
            except Exception:
                pass

        time.sleep(duration)

        video = page.video
        context.close()  # finalizza la registrazione
        if browser is not None:
            browser.close()
        src = video.path() if video else None

    if not src or not os.path.exists(src):
        raise RuntimeError("Registrazione non prodotta: controlla URL/login/selettori.")

    if audio_proc is not None:
        audio_proc.wait(timeout=30)
        if os.path.exists(audio_tmp) and os.path.getsize(audio_tmp) > 0:
            muxed_ok = _mux_video_audio(src, audio_tmp, out_video)
            os.remove(audio_tmp)
            if muxed_ok:
                if os.path.abspath(src) != os.path.abspath(out_video):
                    os.remove(src)
                return out_video
            print("Avviso: muxing audio fallito, uso il video senza audio.", flush=True)
        else:
            print("Avviso: nessun audio catturato (dispositivo silenzioso?), "
                  "uso il video senza audio.", flush=True)

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
                   help="File JSON con la sessione loggata (vedi --login). "
                        "Preferisci --profile-dir: non scade.")
    p.add_argument("--profile-dir", default=None,
                   help="Cartella profilo browser persistente: il login fatto lì "
                        "resta valido tra le esecuzioni (consigliato).")
    p.add_argument("--login", action="store_true",
                   help="Apre un browser visibile per il login manuale e salva "
                        "la sessione (in --profile-dir o --storage-state), poi esce.")
    p.add_argument("--show", action="store_true", help="Browser visibile (non headless).")
    p.add_argument("--no-audio", action="store_true",
                   help="Disattiva la cattura audio (registra solo video).")
    p.add_argument("--audio-device", default=None,
                   help="Indice dispositivo avfoundation da usare per l'audio "
                        "(default: auto-rileva un dispositivo BlackHole).")
    args = p.parse_args(argv)

    if args.login:
        if args.profile_dir:
            login_persistent(args.url, args.profile_dir)
            return 0
        if not args.storage_state:
            print("ERRORE: --login richiede --profile-dir DIR (o --storage-state PATH)",
                  flush=True)
            return 2
        login_and_save_state(args.url, args.storage_state)
        return 0

    audio_device = None if args.no_audio else (args.audio_device or "auto")
    out = capture_replay(
        args.url, args.out, duration=args.duration,
        storage_state=args.storage_state, profile_dir=args.profile_dir,
        headless=not args.show, audio_device=audio_device,
    )
    print(f"Registrato: {out}")
    print(f"Ora elaboralo:  python -m vcr {out} -o output --language it")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
