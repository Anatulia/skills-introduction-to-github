"""Download diretto del video di una lezione dallo stream HLS.

Molti player (Bunny Stream, ecc.) riproducono un HLS servito da CDN con un
token di sessione nell'URL. Invece di *registrare* la scheda in tempo reale
(lento, richiede l'audio di sistema e un dispositivo di loopback), qui:

  1. si apre il browser loggato (profilo persistente) e si intercetta l'URL
     autenticato del manifest .m3u8 (senza dover far partire la riproduzione);
  2. si scarica con ffmpeg — molto più veloce del tempo reale, con audio
     pulito preso dalla fonte e nessun taglio finale.

Uso previsto: contenuti che l'utente possiede, per uso personale.

  # una volta sola:
  python -m vcr.capture "URL_LEZIONE" --login --profile-dir profile
  # poi, per ogni lezione:
  python -m vcr.download "URL_LEZIONE" -o lezione.mp4 --profile-dir profile
"""
from __future__ import annotations

import os
import subprocess
import time

from .capture import _launch_persistent, _ensure_logged_in


def sniff_manifest(url: str, profile_dir: str, timeout_s: float = 20.0) -> str | None:
    """Apre la lezione nel browser loggato e ritorna l'URL del manifest HLS
    principale (playlist.m3u8), o None se non intercettato entro `timeout_s`."""
    from playwright.sync_api import sync_playwright

    found: list[str] = []

    with sync_playwright() as p:
        context = _launch_persistent(p, profile_dir, headless=False)
        page = context.pages[0] if context.pages else context.new_page()

        def on_request(req):
            if ".m3u8" in req.url:
                found.append(req.url)

        page.on("request", on_request)
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(5000)
        _ensure_logged_in(page, url)

        deadline = time.time() + timeout_s
        while time.time() < deadline and not found:
            page.wait_for_timeout(1000)

        context.close()

    if not found:
        return None
    # preferisci il manifest "master" (playlist.m3u8) alle sotto-varianti per risoluzione.
    for u in found:
        if "playlist.m3u8" in u:
            return u
    return found[0]


def _select_variant(master_url: str, height: int, referer: str) -> str:
    """Dal master playlist sceglie la variante con altezza <= `height` (la
    più alta che rispetta il limite; se nessuna, la più bassa). Ritorna
    l'URL assoluto del sotto-manifest, o `master_url` se non parsabile."""
    import urllib.parse
    import urllib.request

    req = urllib.request.Request(master_url, headers={"Referer": referer})
    try:
        body = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    except Exception:
        return master_url

    variants = []  # (altezza, url_assoluto)
    lines = body.splitlines()
    for i, line in enumerate(lines):
        if line.startswith("#EXT-X-STREAM-INF"):
            h = None
            if "RESOLUTION=" in line:
                res = line.split("RESOLUTION=")[1].split(",")[0].strip()
                if "x" in res:
                    try:
                        h = int(res.split("x")[1])
                    except ValueError:
                        h = None
            # l'URI della variante è la riga non-commento successiva
            for nxt in lines[i + 1:]:
                if nxt and not nxt.startswith("#"):
                    abs_url = urllib.parse.urljoin(master_url, nxt.strip())
                    variants.append((h or 0, abs_url))
                    break

    if not variants:
        return master_url
    ok = [v for v in variants if v[0] and v[0] <= height]
    if ok:
        return max(ok, key=lambda v: v[0])[1]
    return min(variants, key=lambda v: v[0])[1]


def download_hls(manifest_url: str, out_path: str, height: int | None = 720,
                 referer: str = "https://iframe.mediadelivery.net/") -> str:
    """Scarica lo stream HLS in `out_path` (mp4). Se `height` è indicato,
    seleziona la variante di qualità <= height (per non scaricare inutilmente
    il 4K); None = qualità massima (ffmpeg sceglie il bitrate più alto)."""
    out_dir = os.path.dirname(os.path.abspath(out_path)) or "."
    os.makedirs(out_dir, exist_ok=True)

    src = manifest_url
    if height is not None:
        src = _select_variant(manifest_url, height, referer)

    cmd = ["ffmpeg", "-y", "-referer", referer, "-i", src,
           "-c", "copy", "-bsf:a", "aac_adtstoasc", out_path]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
    if result.returncode != 0 or not os.path.exists(out_path):
        raise RuntimeError(f"Download HLS fallito:\n{result.stderr[-1500:]}")
    return out_path


def main(argv: list[str] | None = None) -> int:
    import argparse

    p = argparse.ArgumentParser(
        prog="vcr-download",
        description="Scarica il video di una lezione dallo stream HLS "
                    "(molto più veloce della registrazione in tempo reale).",
    )
    p.add_argument("url", help="URL della lezione (pagina del corso).")
    p.add_argument("-o", "--out", default="lezione.mp4", help="File di output (.mp4).")
    p.add_argument("--profile-dir", required=True,
                   help="Cartella profilo persistente con il login (vedi "
                        "`vcr.capture --login --profile-dir`).")
    p.add_argument("--height", type=int, default=720,
                   help="Altezza massima da scaricare (default 720; 0 = massima).")
    args = p.parse_args(argv)

    print("Intercetto lo stream della lezione…", flush=True)
    manifest = sniff_manifest(args.url, args.profile_dir)
    if not manifest:
        print("ERRORE: nessun manifest HLS intercettato. La lezione usa un "
              "player diverso? Ripiega su `python -m vcr.capture`.", flush=True)
        return 1
    print("Scarico il video…", flush=True)
    out = download_hls(manifest, args.out, height=(args.height or None))
    print(f"Scaricato: {out}")
    print(f"Ora elaboralo:  python -m vcr {out} -o output --language it")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
