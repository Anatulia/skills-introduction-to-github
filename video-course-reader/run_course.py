"""Batch: scarica ed elabora tutte le lezioni con video di un corso.

Legge lessons_index.json (prodotto elencando la sidebar del corso) e, per ogni
lezione con un video, esegue: download HLS -> pipeline vcr (motore openai).
Idempotente: salta le lezioni il cui output esiste già.

  python run_course.py            # tutte le lezioni con video
  python run_course.py 3 5 7      # solo le lezioni indicate (per numero)
"""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
INDEX = os.path.join(ROOT, "lessons_index.json")
PROFILE = os.path.join(ROOT, "profile")


def slug(url: str) -> str:
    return url.rstrip("/").split("/")[-2]  # .../lessons/<slug>/view


def main() -> int:
    with open(INDEX) as f:
        lessons = json.load(f)

    only = {int(a) for a in sys.argv[1:]} if len(sys.argv) > 1 else None
    # tutte le lezioni con URL: quelle con `duration` sono video, le altre
    # sono lezioni testuali/hub di materiali (gestite senza scaricare video).
    todo = [l for l in lessons if l.get("url")]
    if only:
        todo = [l for l in todo if l["n"] in only]

    print(f"Lezioni da elaborare: {[l['n'] for l in todo]}", flush=True)
    done, failed = [], []

    for l in todo:
        n, url = l["n"], l["url"]
        name = slug(url)
        video = os.path.join(ROOT, f"corso_lezione{n:02d}.mp4")
        out_dir = os.path.join(ROOT, f"corso_output/lezione{n:02d}_{name}")
        md = os.path.join(out_dir, "corso.md")

        if os.path.exists(md):
            print(f"[{n}] già fatto, salto.", flush=True)
            done.append(n)
            continue

        try:
            if not l.get("duration"):
                # lezione senza video: testo della pagina + materiali allegati
                print(f"[{n}] lezione testuale (testo + materiali)… ({l['title']})", flush=True)
                subprocess.run(
                    [sys.executable, "-m", "vcr.textlesson", url, "-o", out_dir,
                     "--profile-dir", PROFILE, "--title", l["title"]],
                    cwd=ROOT, check=True,
                )
            else:
                if not os.path.exists(video):
                    print(f"[{n}] download… ({l['title']})", flush=True)
                    subprocess.run(
                        [sys.executable, "-m", "vcr.download", url, "-o", video,
                         "--profile-dir", PROFILE, "--height", "720"],
                        cwd=ROOT, check=True,
                    )
                print(f"[{n}] elaborazione (openai)…", flush=True)
                subprocess.run(
                    [sys.executable, "-m", "vcr", video, "-o", out_dir,
                     "--language", "it", "--engine", "openai", "--no-vision",
                     "--title", l["title"]],
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
