"""Batch: scarica ed elabora tutte le lezioni video del corso Hotmart.

Legge hotmart_lessons_index.json (titoli + content-id, estratti dalla sidebar
nel browser reale dell'utente) e hotmart_vimeo_ids.txt (content-id -> vimeo id,
estratto navigando ogni lezione nel browser reale, via estensione claude-in-chrome:
necessario perché il login è solo Google, bloccato nel browser automatizzato).

Per ogni lezione video: yt-dlp (referer Hotmart, sblocca il domain-lock Vimeo)
poi pipeline vcr (motore openai). Le lezioni "Materiale extra" (no_video) sono
saltate qui (gestione manuale separata, come le lezioni testuali Atena).
Idempotente: salta le lezioni il cui output esiste già.

  python run_hotmart_course.py            # tutte le lezioni video
  python run_hotmart_course.py 9 10 11    # solo le lezioni indicate (per numero)
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
COURSE_DIR = os.path.join(ROOT, "corsi", "hotmart-claude-code")
INDEX = os.path.join(COURSE_DIR, "hotmart_lessons_index.json")
VIMEO_MAP = os.path.join(COURSE_DIR, "hotmart_vimeo_ids.txt")
PY = os.path.join(ROOT, ".venv", "bin", "python3")
REFERER = "https://hotmart.com/"


def slug(title: str) -> str:
    t = re.sub(r"[^\w\s-]", "", title, flags=re.U).strip().lower()
    t = re.sub(r"[\s_-]+", "-", t)
    return t[:60].strip("-") or "lezione"


def load_vimeo_map():
    m = {}
    with open(VIMEO_MAP) as f:
        for line in f:
            line = line.strip()
            if not line or ":" not in line:
                continue
            cid, vid = line.split(":", 1)
            m[cid] = vid
    return m


def main() -> int:
    with open(INDEX) as f:
        lessons = json.load(f)
    vimeo = load_vimeo_map()

    only = {int(a) for a in sys.argv[1:]} if len(sys.argv) > 1 else None
    todo = [l for l in lessons if not l.get("no_video")]
    if only:
        todo = [l for l in todo if l["n"] in only]

    print(f"Lezioni video da elaborare: {[l['n'] for l in todo]}", flush=True)
    done, failed, skipped = [], [], []

    for l in todo:
        n, cid, title = l["n"], l["id"], l["title"]
        vid = vimeo.get(cid)
        name = slug(title)
        video = os.path.join(ROOT, f"hotmart_lezione{n:02d}.mp4")
        out_dir = os.path.join(COURSE_DIR, f"lezione{n:02d}_{name}")
        md = os.path.join(out_dir, "corso.md")

        if os.path.exists(md):
            print(f"[{n}] già fatto, salto.", flush=True)
            done.append(n)
            continue
        if not vid:
            print(f"[{n}] ERRORE: nessun ID Vimeo noto per {cid} ({title}); salto.", flush=True)
            skipped.append(n)
            continue

        try:
            if not os.path.exists(video):
                print(f"[{n}] download… ({title})", flush=True)
                subprocess.run(
                    ["yt-dlp", "--referer", REFERER,
                     "-f", "bv*[height<=720]+ba/b[height<=720]/b",
                     "--merge-output-format", "mp4",
                     "-o", video, f"https://player.vimeo.com/video/{vid}"],
                    cwd=ROOT, check=True,
                )
            print(f"[{n}] elaborazione (openai)…", flush=True)
            subprocess.run(
                [PY, "-m", "vcr", video, "-o", out_dir,
                 "--language", "it", "--engine", "openai", "--no-vision",
                 "--title", title],
                cwd=ROOT, check=True,
            )
            done.append(n)
            print(f"[{n}] OK -> {out_dir}", flush=True)
        except subprocess.CalledProcessError as e:
            failed.append(n)
            print(f"[{n}] ERRORE: {e}", flush=True)

    print(f"\nCompletate: {done}", flush=True)
    if skipped:
        print(f"Saltate (no ID): {skipped}", flush=True)
    if failed:
        print(f"Fallite: {failed}", flush=True)
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
