"""Batch: scarica ed elabora tutte le lezioni del corso "Scacco Matto Al Fisco".

Legge corsi/scacco-matto-al-fisco/lessons_index.json (21 lezioni, tutte video:
titolo + ID Vimeo, estratti navigando il corso nel browser reale dell'utente
sull'academy — piattaforma membership con player Vimeo privato in iframe).

Per ogni lezione: yt-dlp (referer dell'academy, sblocca il domain-lock Vimeo,
nessun cookie necessario) poi pipeline vcr (motore openai). Idempotente:
salta le lezioni il cui output esiste già. Il video scaricato resta nella
cartella della lezione come lezione.mp4 (gitignored).

  python run_scacco_matto.py            # tutte le lezioni
  python run_scacco_matto.py 3 5 7      # solo le lezioni indicate (per numero)
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
COURSE_DIR = os.path.join(ROOT, "corsi", "scacco-matto-al-fisco")
INDEX = os.path.join(COURSE_DIR, "lessons_index.json")
PY = os.path.join(ROOT, ".venv", "bin", "python3")
REFERER = "https://academy.carloalbertomicheli.it/"


def slug(title: str) -> str:
    t = re.sub(r"[^\w\s-]", "", title, flags=re.U).strip().lower()
    t = re.sub(r"[\s_-]+", "-", t)
    return t[:60].strip("-") or "lezione"


def main() -> int:
    with open(INDEX) as f:
        lessons = json.load(f)

    only = {int(a) for a in sys.argv[1:]} if len(sys.argv) > 1 else None
    todo = [l for l in lessons if not only or l["n"] in only]

    print(f"Lezioni da elaborare: {[l['n'] for l in todo]}", flush=True)
    done, failed = [], []

    for l in todo:
        n, vid, title = l["n"], l["vimeo"], l["title"]
        out_dir = os.path.join(COURSE_DIR, f"lezione{n:02d}_{slug(title)}")
        video = os.path.join(out_dir, "lezione.mp4")
        md = os.path.join(out_dir, "corso.md")

        if os.path.exists(md):
            print(f"[{n}] già fatto, salto.", flush=True)
            done.append(n)
            continue

        try:
            os.makedirs(out_dir, exist_ok=True)
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
    if failed:
        print(f"Fallite: {failed}", flush=True)
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
