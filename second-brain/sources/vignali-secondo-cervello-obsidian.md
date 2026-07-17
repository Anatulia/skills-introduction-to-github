# SOURCE — Dario Vignali, "Crea il tuo secondo cervello e fai lavorare l'AI al posto tuo" (captured 2026-07-17)

- Autore: Dario Vignali (Substack)
- Data pubblicazione: 16 apr 2026
- Origine file: Dropbox `Migrazione-PC-INCICO-2026-07/05-Personale/Personale/Analogista/Guida di Dario Vignali per Osidian+Agenti/` (file .docx 5.3MB — estratto localmente con `textutil` macOS, il servizio Dropbox di estrazione testo ha un limite di 5MB)
- Nota: capture/sintesi condensata dal .docx originale. Immutabile — non modificare.

---

## Sintesi condensata

Terza guida, la più operativa: come Obsidian diventa la memoria persistente
di un sistema di agenti AI (il "vault"). Tesi: il vero vantaggio competitivo
non è conoscere l'ultimo tool, ma **costruire la propria intelligenza
digitale** — una replica esterna, scritta e leggibile dall'AI, del proprio
modo di pensare/decidere/lavorare (non solo un foglio di stile o un
claude.md: strategia, esperienze, competenze, standard di qualità, criteri).

**Il problema di partenza.** Un agente con claude.md/reference/memory.md
perfetti produce comunque idee "generiche" (7/10) perché non conosce i
pensieri mai formalizzati dall'utente (intuizioni sotto la doccia, in
macchina, idee sparse tra note telefono/vocali/tab browser). Il 90% delle
idee migliori non viene mai scritto da nessuna parte e si perde.

**Perché Obsidian.** App gratuita per note; salva in file `.md` locali (non
database proprietario, non cloud terzi). La cartella si chiama "vault". I
link tra note (wiki-link `[[...]]`) creano un grafo navigabile. I file di
Obsidian sono **gli stessi file** letti/scritti da Claude Code → puntare
Claude Code sulla cartella Obsidian rende il second brain il contesto vivo
dell'agente.

**File nel vault vs dati in app esterne (Notion/Todoist/Apple Notes).**
Argomento centrale: leggere `.md` locali costa a Claude "velocità di
filesystem" (millisecondi, centinaia di file in parallelo, come "memoria
operativa"); leggere da Notion via MCP richiede una "chiamata telefonica"
per ogni nota (autenticazione, latenza, costo token) — su richieste che
attraversano centinaia di note, l'agente si ferma a metà o esplora solo un
sottoinsieme, **senza dirlo**, dando risposte apparentemente complete ma
basate su dati parziali. Principio citato: **"file over app"** (CEO di
Obsidian) e **"always bet on text"** (il testo sopravvive a ogni app).

**Setup in 4 passi:** (1) installare Obsidian, puntarlo sulla cartella
Claude Code esistente; (2) attivare la CLI di Obsidian nelle impostazioni
("Interfaccia da riga di comando") per far comunicare Obsidian↔Claude Code;
(3) aggiungere nel claude.md globale una sezione "OBSIDIAN" con regola
wiki-link (menzioni di altri file → sempre `[[nome-file]]`) e regola di
cross-linking; (4) far scansionare a Claude i file esistenti per aggiungere
wiki-link ai riferimenti "piatti" già presenti.

**Daily notes.** Un file al giorno, compilato in ~5 min: progetti della
giornata, "cosa mi gira in testa" (cattura pensiero grezzo — la sezione più
importante per l'agente), task completate, "cosa ho notato", chiusura
giornata. Il valore è nell'accumulo, non nella singola nota.

**Task nel vault, non in un'app.** Un file `tasks.md` per progetto, formato
checkbox Obsidian con emoji standard (📅 scadenza, ⏫/🔺/🔽 priorità, 🔁
ricorrenza, ✅ completamento). Le task si aggiungono/chiudono **parlando**
con Claude Code ("Aggiungi task: ... entro venerdì, importante") — l'agente
calcola la data assoluta, la priorità, e fa **routing automatico** nel file
giusto in base a regole scritte nel claude.md globale (progetto nominato →
tasks.md di quel progetto; delega → agenda-deleghe.md; senza progetto chiaro
→ hub.md; spesa → spesa.md; ricorrente → routines.md).

**Distinzione task vs memoria.** "Ricordami di fare X entro venerdì" (task,
azionabile, si chiude) vs "ricordati che Marco preferisce WhatsApp" (memoria,
non azionabile, informa decisioni future). Mescolarle nella stessa lista
rompe la fiducia nel sistema.

**Apple Promemoria come rete di cattura mobile.** Una lista "Inbox" dove
finisce tutto senza categorizzazione (via Siri). Una skill `inbox-sync`
(chiamabile a comando) legge la Inbox, interpreta ogni voce, la smista nei
file giusti del vault (o in MEMORY.md se era una memoria travestita da
promemoria), marca gli originali come fatti in Promemoria.

**Superpotere retroattivo.** Con task, memorie, transcript call e report
tutti nello stesso vault leggibile, l'agente può ricostruire in 30 secondi
la sequenza operativa esatta di un evento passato (es. "cosa abbiamo fatto
l'anno scorso per lanciare Business Genetics?") — cosa impossibile con dati
sparsi tra app diverse.

**Case study Mastermind.** Il lancio annuale del Marketers Mastermind è
passato da 3-4 giorni pieni (anno precedente) a "un decimo del tempo": con
il vault popolato, Claude Code ha costruito da solo landing page, PDF,
grafiche, copy — output pronto per andare live senza rifiniture, perché
aveva letto mesi di contesto (tono, design, dati, storia lanci precedenti).

**Manutenzione del vault (si organizza da solo):**
- **MOC (Map of Content):** un file hub per progetto (es. `business-genetics.md`)
  che linka tutti i file del progetto — l'AI stessa lo crea/aggiorna.
  Serve sia per il grafo visuale sia per la velocità di orientamento
  dell'agente (legge il MOC per primo, non esplora a caso).
- **Wiki-link automatici:** Claude trasforma le menzioni testuali di entità
  note (progetti/clienti) in `[[wikilink]]` in automatico, secondo una
  whitelist nel claude.md globale (nomi univoci multi-parola, mai parole
  singole ambigue).
- **Cartella `calls/`:** integrazione Granola (registrazione/trascrizione
  automatica) + plugin "Granola Sync Plus" per Obsidian → ogni call finisce
  automaticamente in `knowledge/calls/YYYY-MM-DD-descrizione.md` del
  progetto giusto, senza intervento manuale.
- **`references/` vs `knowledge/`:** references = file sintetici caricati
  SEMPRE a ogni sessione (positioning, stile); knowledge = file lunghi
  caricati ON-DEMAND (report estesi, transcript). Motivo: il contesto ha un
  costo — troppo caricato satura e confonde l'agente.

**Vault come "partner di pensiero".** Riferimento a un episodio del podcast
di Greg Isenberg (ospite "Internet Vin"): comandi Claude Code custom che
tracciano l'evoluzione di un'idea attraverso mesi di note, trovano ponti
concettuali tra domini distanti, generano idee di business dai pattern del
vault stesso. Citazione: Isenberg paragona il vault-con-agente a un
terapeuta — non dice cosa pensare, aiuta a vedere cosa si sta già pensando.

**No vendor lock-in.** I file restano `.md` leggibili da qualsiasi editor
anche senza Obsidian (si perdono solo grafo/click, non i dati).

**Ciclo quotidiano stimato: 10 minuti/giorno** (5 min mattina + cattura
sparsa durante il giorno) per un sistema che compounda nel tempo.

## Fonti collegate
- Guida precedente: [[vignali-team-di-agenti-ai]]
- Guida introduttiva: [[vignali-agenti-ai-guida-intro]]
