# video-course-reader (`vcr`)

Trasforma un **video-corso** in un **documento leggibile**: trascrizione
sincronizzata con gli screenshot dei momenti chiave, più la "lettura" dei
contenuti visivi (frecce *clicca-qui*, grafici, slide di testo).

Nasce da un caso reale: leggere webinar/corsi in cui le indicazioni sono date
**rispetto a un'immagine** (dove cliccare, un grafico da interpretare, ecc.).

> ⚠️ **Input = file video locale.** Lo strumento NON scarica da piattaforme
> di streaming (es. replay WebinarJam): quei link sono protetti da sessione
> (rispondono `403`) e lo scraping può violarne i ToS. Procurati l'`.mp4`
> (export se il corso è tuo, o registrazione schermo) e dallo in pasto a `vcr`.

## Come funziona

```
video.mp4
   ├─ audio  → trascrizione con timestamp        (faster-whisper, locale)
   └─ video  → keyframe via scene-detection ibrida (ffmpeg)
                 └─ per keyframe: OCR + descrizione vision (Claude)
   → allineamento per timestamp
   → output: corso.md / corso.html / corso.json + cartella frames/
```

### Perché scene-detection e non "ogni N secondi"

Per i corsi slide-based catturare a intervallo fisso genera decine di
screenshot identici e rischia di mancare i cambi rapidi. `vcr` usa un approccio
**ibrido**:

- **trigger = cambio scena** (filtro `scene` di ffmpeg) → uno screenshot
  *esattamente quando* il contenuto cambia;
- **gap minimo** (`--min-gap`, def. 4s) → niente raffiche durante le animazioni;
- **gap massimo** (`--max-gap`, def. 60s) → uno screenshot periodico anche se la
  slide resta ferma a lungo;
- il **primo frame** (t=0) è sempre incluso.

## Installazione

```bash
pip install -r requirements.txt
# dipendenze di sistema:
#   Debian/Ubuntu: apt-get install ffmpeg tesseract-ocr tesseract-ocr-ita
#   macOS (brew):  brew install ffmpeg tesseract tesseract-lang
```

## Uso

```bash
# base (autodetect lingua, OCR on, vision se c'è la chiave)
python -m vcr lezione.mp4 -o output --title "Corso X"

# webinar italiano, modello whisper più accurato
python -m vcr webinar.mp4 -o out --language it --whisper-model large-v3

# solo trascrizione + screenshot, niente AI esterna
python -m vcr lezione.mp4 --no-vision --no-ocr

# più sensibile ai cambi scena, screenshot più fitti
python -m vcr lezione.mp4 --scene-threshold 0.20 --min-gap 2
```

Per la descrizione vision serve la variabile d'ambiente:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Degradazione elegante

| Componente            | Se manca…                          | Effetto |
|-----------------------|------------------------------------|---------|
| `ffmpeg`/`ffprobe`    | errore chiaro                      | obbligatori |
| `faster-whisper`      | errore chiaro                      | obbligatorio per l'audio |
| `tesseract` / API key | si salta, senza rompere            | output senza OCR / senza descrizioni |

Così lo strumento è utile anche a **zero chiavi e zero costi**
(screenshot + trascrizione), e diventa "intelligente" quando aggiungi la chiave.

## Output

- `corso.md` — Markdown con screenshot, descrizioni e trascrizione per sezione
- `corso.html` — stessa cosa, sfogliabile nel browser
- `corso.json` — dati strutturati (per costruirci sopra una UI web, fase 2)
- `frames/` — gli screenshot estratti

## Struttura

```
vcr/
  cli.py         entrypoint argparse  (python -m vcr)
  pipeline.py    orchestratore
  keyframes.py   scene-detection ibrida + estrazione (ffmpeg)
  transcribe.py  faster-whisper
  describe.py    OCR (tesseract) + vision (Claude)
  render.py      allineamento + Markdown/HTML/JSON
  utils.py       helper ffmpeg/timestamp
tests/
  test_logic.py  test della logica pura (timeline, allineamento)
```

## Roadmap

- [x] **Fase 1 — pipeline CLI** (questa)
- [ ] **Fase 2 — web app**: upload del video + viewer navigabile con
  trascrizione e screenshot sincronizzati (il `corso.json` è già il modello dati).
