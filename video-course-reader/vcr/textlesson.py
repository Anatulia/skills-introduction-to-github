"""Lezioni SENZA video (testo / hub di materiali).

Alcune "lezioni" di un corso non sono video ma pagine di testo (intro,
messaggio finale) e/o hub di materiali scaricabili (guide Google Docs, PDF).
Per queste produciamo comunque gli appunti: il testo della pagina + i
materiali scaricati nella stessa cartella della lezione, elencati con link
locali (coerente con l'output delle lezioni video).

  python -m vcr.textlesson "URL_LEZIONE" -o out_dir --profile-dir profile
"""
from __future__ import annotations

import html
import os
import re
import urllib.request

from .capture import _launch_persistent, _ensure_logged_in

_GDOC_RE = re.compile(r"docs\.google\.com/document/d/([A-Za-z0-9_-]+)")
_GSLIDE_RE = re.compile(r"docs\.google\.com/presentation/d/([A-Za-z0-9_-]+)")
_GSHEET_RE = re.compile(r"docs\.google\.com/spreadsheets/d/([A-Za-z0-9_-]+)")
_FILE_RE = re.compile(r"\.(pdf|zip|docx?|xlsx?|pptx?|mp3|mp4)(\?|$)", re.I)


def _slug(text: str, fallback: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text, flags=re.U).strip()
    text = re.sub(r"[\s_-]+", "-", text)
    return (text[:70].strip("-") or fallback).lower()


def _download(url: str, dest: str) -> bool:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
            f.write(r.read())
        return os.path.getsize(dest) > 0
    except Exception:
        return False


def _material_url(href: str) -> tuple[str, str] | None:
    """Se il link è un materiale scaricabile, ritorna (url_download, estensione).
    Google Docs/Slides/Sheets → export PDF; file diretti → così com'è."""
    m = _GDOC_RE.search(href)
    if m:
        return f"https://docs.google.com/document/d/{m.group(1)}/export?format=pdf", "pdf"
    m = _GSLIDE_RE.search(href)
    if m:
        return f"https://docs.google.com/presentation/d/{m.group(1)}/export/pdf", "pdf"
    m = _GSHEET_RE.search(href)
    if m:
        return f"https://docs.google.com/spreadsheets/d/{m.group(1)}/export?format=pdf", "pdf"
    m = _FILE_RE.search(href)
    if m:
        return href, m.group(1).lower()
    return None


def extract_text_lesson(url: str, out_dir: str, profile_dir: str, title: str = "Lezione") -> dict:
    """Estrae testo + materiali di una lezione senza video. Scrive corso.md,
    corso.html e la cartella materiali/. Ritorna un riepilogo."""
    from playwright.sync_api import sync_playwright

    os.makedirs(out_dir, exist_ok=True)
    mat_dir = os.path.join(out_dir, "materiali")

    with sync_playwright() as p:
        context = _launch_persistent(p, profile_dir, headless=True)
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(url, wait_until="domcontentloaded", timeout=30000)
        page.wait_for_timeout(5000)
        _ensure_logged_in(page, url)
        page.wait_for_timeout(2000)
        for _ in range(12):
            page.mouse.wheel(0, 1200)
            page.wait_for_timeout(300)
        page.wait_for_timeout(1000)
        data = page.evaluate(
            """() => {
                const main = document.querySelector('main') || document.body;
                const links = [...main.querySelectorAll('a[href]')].map(a => ({
                    text: (a.innerText||'').trim().slice(0,120), href: a.href,
                }));
                return {text: main.innerText, links};
            }"""
        )
        context.close()

    # materiali scaricabili (dedup per url di download)
    materials, seen, external = [], set(), []
    for l in data["links"]:
        info = _material_url(l["href"])
        if info:
            dl_url, ext = info
            if dl_url in seen:
                continue
            seen.add(dl_url)
            materials.append((l["text"] or "materiale", dl_url, ext))
        elif l["href"] and not l["href"].startswith(url.split("/lessons/")[0]):
            # link esterno non-file (es. WhatsApp consulenza): lo teniamo come riferimento
            if l["text"]:
                external.append((l["text"], l["href"]))

    saved = []
    if materials:
        os.makedirs(mat_dir, exist_ok=True)
        for i, (name, dl_url, ext) in enumerate(materials, 1):
            fn = f"{i:02d}_{_slug(name, f'materiale{i}')}.{ext}"
            dest = os.path.join(mat_dir, fn)
            if _download(dl_url, dest):
                saved.append((name, os.path.join("materiali", fn)))

    _write_docs(out_dir, title, data["text"], saved, external)
    return {"title": title, "materiali": len(saved), "esterni": len(external)}


def _clean_text(text: str) -> str:
    lines = [ln.strip() for ln in text.splitlines()]
    out, prev_blank = [], False
    for ln in lines:
        if not ln:
            if not prev_blank:
                out.append("")
            prev_blank = True
        else:
            out.append(ln)
            prev_blank = False
    return "\n".join(out).strip()


def _write_docs(out_dir, title, text, saved, external):
    body = _clean_text(text)

    md = [f"# {title}\n", "> Lezione senza video: testo della pagina e materiali allegati.\n",
          "## Contenuto\n", body, ""]
    if saved:
        md.append("\n## Materiali scaricati\n")
        for name, rel in saved:
            md.append(f"- [{name}]({rel})")
    if external:
        md.append("\n## Link esterni\n")
        for name, href in external:
            md.append(f"- [{name}]({href})")
    with open(os.path.join(out_dir, "corso.md"), "w") as f:
        f.write("\n".join(md) + "\n")

    h = [f"<meta charset=utf-8><h1>{html.escape(title)}</h1>",
         "<p><em>Lezione senza video: testo della pagina e materiali allegati.</em></p>",
         "<h2>Contenuto</h2>", "<pre style='white-space:pre-wrap;font-family:inherit'>"
         + html.escape(body) + "</pre>"]
    if saved:
        h.append("<h2>Materiali scaricati</h2><ul>")
        h += [f"<li><a href='{html.escape(rel)}'>{html.escape(name)}</a></li>" for name, rel in saved]
        h.append("</ul>")
    if external:
        h.append("<h2>Link esterni</h2><ul>")
        h += [f"<li><a href='{html.escape(href)}'>{html.escape(name)}</a></li>" for name, href in external]
        h.append("</ul>")
    with open(os.path.join(out_dir, "corso.html"), "w") as f:
        f.write("\n".join(h))


def main(argv=None) -> int:
    import argparse
    p = argparse.ArgumentParser(prog="vcr-textlesson",
        description="Appunti + materiali per una lezione senza video.")
    p.add_argument("url")
    p.add_argument("-o", "--out", required=True)
    p.add_argument("--profile-dir", required=True)
    p.add_argument("--title", default="Lezione")
    a = p.parse_args(argv)
    r = extract_text_lesson(a.url, a.out, a.profile_dir, a.title)
    print(f"Fatto: {r['materiali']} materiali scaricati, {r['esterni']} link esterni -> {a.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
