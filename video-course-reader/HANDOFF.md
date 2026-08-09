# Handoff — App "Video-corso → appunti / memorie / manuali"

Documento per riprendere il lavoro in **un'altra sessione** senza ricominciare
da capo. Progetto: trasformare un video-corso in un documento leggibile
(trascrizione + screenshot + lettura dei contenuti visivi).

---

## 1. Obiettivo
App che, dato un video-corso, produce **appunti/manuale**:
- **trascrizione** con timestamp,
- **screenshot** catturati ai cambi scena (slide, schermate, "dove cliccare"),
- **lettura visiva** di ogni screenshot (frecce/indicazioni, grafici, testo).

Casi d'uso reali: corsi su comunicazione non verbale, short YouTube, "profitti
digitali" (piattaforme WebinarJam / Atena Platform, ecc.).

## 2. Dove sta il codice
- Repo GitHub: **`Anatulia/skills-introduction-to-github`**
- Branch: **`claude/webinar-transcription-course-app-x03f32`**
- Cartella: **`video-course-reader/`**
- Tutto committato e pushato. Nella nuova sessione: **`git pull`**.

## 3. Cosa è GIÀ costruito e funzionante
Pacchetto Python `vcr` (pipeline CLI, testata):
| File | Ruolo |
|------|-------|
| `keyframes.py` | scene-detection **ibrida** via ffmpeg: cambio scena + gap minimo (anti-duplicati) + gap massimo (copre slide statiche) |
| `transcribe.py` | due motori ASR: **faster-whisper** (default, modelli da HuggingFace) e **sherpa** (modelli da GitHub, per reti che bloccano HF; blocchi da 30s) |
| `describe.py` | **OCR** (tesseract) + **descrizione vision** (Claude); entrambi opzionali, degradano con eleganza |
| `render.py` | allineamento per timestamp → **Markdown / HTML / JSON** |
| `capture.py` | **cattura replay via browser** (Playwright): registra la scheda mentre il replay va in play; login manuale con `storage_state` |
| `pipeline.py` / `cli.py` | orchestratore + CLI `python -m vcr` |
| `tests/test_logic.py` | 7 test della logica pura (verdi) |

## 4. Comandi principali
Elaborare un file video locale:
```bash
python -m vcr video.mp4 -o output --language it --whisper-model small
```
Motore alternativo (dietro reti che bloccano HuggingFace):
```bash
python -m vcr video.mp4 --engine sherpa --whisper-model small --language it
```
Catturare un corso non scaricabile (sul TUO computer, con browser loggato):
```bash
pip install playwright && playwright install chromium
# login una-tantum (si apre un browser vero: le credenziali le digiti solo tu)
python -m vcr.capture "URL_LEZIONE" --login --storage-state sess.json
# test breve (60s), poi elaborazione
python -m vcr.capture "URL_LEZIONE" -o test.webm -d 60 --storage-state sess.json
python -m vcr test.webm -o output --language it
```
Output in `output/`: `corso.md`, `corso.html`, `corso.json`, cartella `frames/`.

## 5. Vincoli e scoperte importanti (per NON rifare gli errori)
- **I link dei corsi non sono scaricabili direttamente**: sono protetti da
  sessione (rispondono `403`). Serve un **file locale** oppure la **cattura via
  browser**.
- **"Claude Code sul web / iPhone" gira in una VM cloud Ubuntu** che per policy
  di rete **blocca TUTTI i siti esterni** (WebinarJam, Atena → `403`; anche
  HuggingFace è bloccato). Quindi da quella sessione **nessun URL di corso
  funziona** e la cattura browser non è possibile.
- **La cattura browser e i corsi online funzionano SOLO nella sessione
  agganciata al Mac** (rete aperta + browser già loggato).
- **Verifica sempre dove sei**: esegui `uname -a`.
  - `Linux vm` → sei nel **cloud** (rete murata).
  - `Darwin ... arm64` + esiste `/Users` → sei sul **Mac** (qui si lavora).
- **Trascrizione**: la qualità dipende molto dall'audio. Audio pulito
  (microfono/webinar) → ottimo. Audio rumoroso/ripreso a mano → incerto a
  prescindere dal modello. Modelli consigliati: `small` (buon compromesso) o
  `large-v3` (migliore) con faster-whisper.
- **Vision automatica**: richiede `ANTHROPIC_API_KEY`. Senza, restano comunque
  screenshot + trascrizione + OCR.
- **Test già superato**: su una clip locale da 2:17 la pipeline ha prodotto
  screenshot + trascrizione (sherpa small) + documento HTML corretti.

## 6. Setup dipendenze (sul Mac)
```bash
brew install ffmpeg tesseract tesseract-lang python git
cd <cartella-del-progetto> && git pull
cd video-course-reader && pip install -r requirements.txt
```

## 7. Prossimi passi
1. Sul **Mac**: `git pull`, installa dipendenze (punto 6).
2. `uname -a` per confermare **Darwin**.
3. Test di **cattura 60s** su una lezione, poi elabora e valuta la qualità.
4. Se ok, alza la durata; per corsi lunghi (3h) registra a **segmenti da
   ~20-30 min** e concatenali prima di elaborare.
5. Attiva la **vision** (`ANTHROPIC_API_KEY`) per le descrizioni dei frame.
6. **Fase 2**: web app viewer navigabile (`corso.json` è già il modello dati).

## 8. Prompt pronto da incollare nella nuova sessione (sul Mac)
> Riprendi il progetto **video-course-reader** sul branch
> `claude/webinar-transcription-course-app-x03f32` (fai `git pull`). È una
> pipeline che trasforma video-corsi in appunti (trascrizione + screenshot ai
> cambi scena + lettura visiva). Per prima cosa esegui `uname -a` e conferma che
> siamo sul **Mac** (Darwin). Poi installa le dipendenze (ffmpeg, tesseract,
> `pip install -r requirements.txt`, `playwright install chromium`) e fai un
> **test di cattura da 60 secondi** della lezione che ti indico, quindi
> elaborala con `python -m vcr`. Leggi `HANDOFF.md` per il contesto completo.
