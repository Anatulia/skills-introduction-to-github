# SOURCE — Dario Vignali & Pietro Virgilito, "Come creare un'azienda agentica con gli Agenti AI di Claude Code" (video, captured 2026-07-17)

- Autori: Dario Vignali (conduzione, prospettiva imprenditoriale) e Pietro
  Virgilito (esperto cybersecurity, ex collaborazioni con Senato e istituzioni —
  prospettiva tecnica)
- Formato: video-corso YouTube ~1h24m, estratto con il sistema `vcr`
  (video-course-reader) in trascrizione + ~100 screenshot sincronizzati
- File originale: `Business/Claude/video-course-reader-repo/video-course-reader/output_youtube/corso.md` (+ .json, .html, frames/)
- Nota: sintesi condensata della trascrizione. Immutabile — non modificare.

---

## Sintesi condensata

Lezione pratica su come costruire una "azienda agentica": un caso d'uso
completo (Agentic Digital Agency — una piccola software house che riceve
richieste di siti web e produce preventivi) implementato con Claude Code come
orchestratore + subagenti. Contesto: Vignali e Virgilito stanno sviluppando
una startup reale usando **più di 150 agenti** al posto di ~10 sviluppatori
full-time che non potevano permettersi.

**Premessa metodologica.** L'agentizzazione NON è plug-and-play: richiede
prima una **auto-analisi aziendale** (mappare processi, dati, dove risiedono,
come vengono manipolati). Analogia imprenditoriale: (1) definire i compiti
come procedure scritte al massimo livello di chiarezza; (2) "assumere" gli
agenti giusti descrivendone ruolo, personalità e competenze — come
l'onboarding di un dipendente.

**Architettura del caso d'uso.** Un orchestratore (il claude.md principale:
"tu sei l'orchestratore, NON fai i lavori, li assegni") + 5 subagenti
specializzati:
- **analista** — legge la richiesta grezza del cliente e la trasforma in
  scheda ordinata (primo della filiera);
- **preventivatore** + **pianificatore** — lavorano IN PARALLELO (task
  indipendenti): prezzi dal listino Excel, tempistiche dall'agenda impegni;
- **redattore** — attende i risultati di entrambi, scrive l'email di offerta
  secondo indicazioni di stile;
- **archivista** — salva l'output (estendibile a: inviare email/WhatsApp,
  scrivere su database, loggare, avvisare il titolare).

**Struttura file del progetto:**
- `claude.md` — il "file madre" dell'orchestratore, SEMPRE caricato nel
  contesto a ogni turno; contiene ruolo, filiera, regole generali.
- `.claude/agents/` — un file .md per subagente (naming obbligato in Claude
  Code), con frontmatter YAML: `name`, `description`, `tools`.
- `data/` — dati aziendali (listino.xlsx, agenda.xlsx) letti SOLO on-demand,
  mai buttati nel contesto a priori.
- `scripts/` — script Python/bash deterministici (leggi-excel, somma-importi,
  giorni-mancanti).
- `settings.json` — permessi: deny assoluto su cancellazioni ("non
  cancellare mai nulla"), allow automatico sugli script propri → la filiera
  gira senza human-in-the-loop.

**Probabilistico vs deterministico** (concetto centrale della lezione).
Gli LLM sono probabilistici: potenti per ragionamento, creatività, lettura di
testo; inaffidabili per computazione su molti dati ("i language model
appartengono al mondo delle parole, non dei numeri"). Le operazioni con
risultato atteso certo (somme, date, letture strutturate) vanno delegate a
**script deterministici** che l'agente invoca come strumenti ("i totali non
si fanno MAI a mente — usa somma-importi.sh"). Il flusso tipico:
probabilistico → tool call deterministico → di nuovo probabilistico.

**Best practice per script scritti dall'AI (per chi non programma):**
- **atomizzazione** — tanti script piccoli con un compito solo, non un
  mega-script: più facile che l'LLM li generi corretti;
- **cross-validation tra modelli** — far scrivere lo script a un modello e
  farlo verificare da un altro ("trovami bug e problemi di sicurezza");
  2-3 cicli bastano.

**Principio dei minimi privilegi** (dalla cybersecurity). Ogni subagente
riceve nei `tools` SOLO ciò che gli serve: l'analista ha solo `Read` (non
scrive, non esegue, non invia). Se l'agente allucina o viene manipolato, il
danno resta confinato ("al massimo legge male"). Configurare un agente per
fare più del necessario = introdurre un rischio.

**Regole di comunicazione tra agenti:**
- Gli specialisti **non si parlano tra loro** (isolamento del contesto:
  ognuno ha un perimetro chiuso che gli altri non vedono) — è il pattern
  base, copre il 70-80% dei casi;
- l'orchestratore fa da "passacarte fedele": passa i risultati COMPLETI al
  prossimo agente, senza riassumere/accorciare/aggiungere;
- il dialogo inter-agente (pattern orizzontali, es. Agent Teams di Claude
  Code, in beta al momento del video) dà più autonomia ma meno controllo e
  richiede molta più ingegnerizzazione;
- **parallelo vs sequenziale**: parallelizzare solo task non interdipendenti
  (preventivo ‖ pianificazione sì; copy → design no); attenzione alle **race
  condition** (due agenti che modificano lo stesso file).

**Perché suddividere invece di un mega-prompt.** Il contesto ha limiti: più
lo si riempie di informazioni disomogenee, più aumenta la probabilità di
errore. Anche i "Progetti" di Claude Web/ChatGPT degradano oltre una certa
soglia di documenti. La gerarchia informativa (orchestratore + perimetri
chiusi) è l'equivalente dell'**accountability** aziendale: processo chiaro +
responsabile chiaro = lavoro fatto; riunione con tutti insieme = caos.

**Granularità degli agenti.** Né agenti-tuttofare né agenti-stupidi da
un'operazione sola (quella è uno script/tool): si parte da un'ipotesi
equilibrata e si rifraziona quando un agente risulta sovraccarico — come
un'azienda che assume un full-stack e poi separa front-end/back-end quando
il lavoro cresce.

**Approccio incrementale (risposta all'obiezione "si perde più tempo").**
Non costruire il sistema completo da subito: partire dai processi più
deterministici e descrivibili, costruire piccoli moduli, validarli sul campo
(es. "l'agente Reddit ha funzionato 4 settimane → è a posto"), poi
orchestrarli. Il case study della dashboard Radar di Vignali (vedi
`vignali-team-di-agenti-ai`) è nato così: partire con quella visione
completa in testa "sarebbe uscita una merda". Valutare sempre se il gioco
vale la candela (analogia della Vespa: overkill per attraversare la strada,
investimento sensato per 25 km di pendolarismo quotidiano).

**Dettagli minori utili:** il MAIUSCOLO nei prompt ha peso reale per l'LLM
(ma sottolineare troppo = non sottolineare nulla); i file citati con `@` in
Claude Code vengono referenziati direttamente senza ricerca; il comando
`/agents` elenca i subagenti registrati; entrambi dettano i file .md con
Superwhisper/VS Code invece di scriverli.

## Fonti collegate
- Serie di guide Substack dello stesso autore: [[vignali-agenti-ai-guida-intro]],
  [[vignali-team-di-agenti-ai]], [[vignali-secondo-cervello-obsidian]]
- Il Radar/dashboard citato come esempio incrementale è descritto in
  [[vignali-team-di-agenti-ai]]
