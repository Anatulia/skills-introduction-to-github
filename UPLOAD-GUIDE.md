# 📤 Come caricare file su GitHub (guida principiante)

Questo è il modo per farmi arrivare qualsiasi file **senza terminale** e **senza
prompt di permesso** — funziona da **PC Windows** e da **iPhone**, direttamente dal
browser. È la via che aggira tutti i blocchi tecnici incontrati.

> Idea di fondo: tu **trascini un file** nella cartella `inbox/` su github.com →
> io faccio `git pull` e **lo leggo/ingerisco** nel second brain.

---

## Da PC Windows (browser)
1. Vai su **github.com** e apri il repository.
2. In alto, controlla di essere sul branch giusto:
   **`claude/content-analysis-summary-ltk090`** (menu a tendina dei branch).
3. Entra nella cartella **`inbox/`**.
4. Clicca **Add file → Upload files**.
5. **Trascina** i tuoi file (PDF, testo, Word, immagini) nell'area, oppure
   **choose your files**.
6. In basso scrivi un breve messaggio (es. *"scritti Dario Vignali"*) e clicca
   **Commit changes**.
7. Scrivimi qui in chat **"fatto"**.

## Da iPhone (browser Safari o app GitHub)
1. Apri **github.com** in Safari (o l'app GitHub) e vai nel repository.
2. Seleziona il branch **`claude/content-analysis-summary-ltk090`**.
3. Entra in **`inbox/`** → **Add file → Upload files**.
4. Tocca **choose your files** → prendi il file da **File**, **Foto** o iCloud.
5. **Commit changes** → poi scrivimi **"fatto"**.

---

## ⚠️ Limiti di dimensione (importante)
- Da **browser**: max **25 MB** per file.
- Via **git** (dal Mac): max **100 MB** per file.
- **Video/audio pesanti**: NON caricarli (vedi `.gitignore`). Serve la
  **trascrizione/testo**, non il file multimediale.

## 🔒 Regole
- **Mai** password, token o `.env` nel repo.
- Un file = un contenuto. Nomi descrittivi.

---

## Dove finiscono i file
- **`inbox/`** → sbarco generico: ci metti tutto ciò che vuoi farmi leggere/ingerire.
  Dopo averli processati li sposto in `inbox/_done/`.
- **`sessioni/`** → transcript/esportazioni di sessioni Claude precedenti (testo).
- **`da-windows/`**, **`da-iphone/`** → sbarco temporaneo per materiale dai due
  dispositivi, che poi smisto nei progetti giusti.
- **`second-brain/_inbox/`** → per le fonti destinate specificamente al vault.
