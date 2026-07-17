# SOURCE — Dario Vignali, "Ho costruito un team di agenti AI che lavora per me. Ora ti spiego come" (captured 2026-07-17)

- Autore: Dario Vignali (Substack)
- Data pubblicazione: 21 apr 2026
- Origine file: Dropbox `Migrazione-PC-INCICO-2026-07/05-Personale/Personale/Analogista/Guida di Dario Vignali per Osidian+Agenti/`
- Nota: capture/sintesi condensata dal .docx originale. Immutabile — non modificare.

---

## Sintesi condensata

Seconda guida della serie: il salto da un singolo agente a un **team di
agenti** che lavora in parallelo, alcuni on-demand, altri autonomi (notte,
mattina presto, weekend). Comunicano tra loro attraverso i file del vault
(non in tempo reale): asincrono, tracciabile, revisionabile — come un team
umano dove il ricercatore scrive un report, il content manager lo legge e
produce contenuti, ecc.

Tre workflow concreti descritti, tutti costruibili "in un weekend":

**1. Il Briefing Mattutino.** Ogni mattina (7:30, prima che l'utente apra il
computer) un agente: legge Google Calendar (più account), controlla le task
con scadenza oggi/in ritardo dai file progetto, processa le registrazioni
Granola del giorno prima (estrae punti chiave/decisioni, li smista nei file
progetto giusti), smista gli Apple Promemoria accumulati in giornata per
progetto/persona, scrive il piano della giornata nella daily note Obsidian.
Stima: risparmio di 30-45 min/giorno → ~150 ore/anno. Costruzione pratica:
creare una **skill** dedicata (Claude fa domande su calendari/formato/
progetti da monitorare), poi **schedularla** (Claude Co-work: task ricorrente
nelle impostazioni; Claude Code: cron job locale/trigger remoto/routine).

**2. La Pipeline Contenuti.** Un URL YouTube → 4-5 output pronti: (1)
transcript via **TranscriptAPI** (MCP a pagamento, pochi centesimi/video),
(2) articolo Substack nel tono dell'autore (basato su un "foglio di stile"
+ cartella di articoli migliori come riferimento), (3) 5 proposte di post
Instagram con angoli diversi, (4) selezione automatica della proposta
migliore (confrontata con dati storici di engagement), (5) carosello
completo su template Canva + 10 prompt immagine per la copertina
(Nanobanana/Midjourney). Un comando ("Processa questo video") esegue l'intera
catena. L'agente non pubblica: produce bozze, l'umano rivede e approva.
Costruzione: si fa un pezzo alla volta (transcript → articolo → post →
carosello), ognuno diventa una skill separata, poi una **skill
orchestratrice** che le concatena.

**3. Il Radar.** Ogni mattina alle 7 un agente **in cloud** (non sul
computer locale) scansiona: 21 subreddit selezionati (engagement relativo
vs media del subreddit nelle ultime 48h), testate internazionali (The
Atlantic, Wired, Bloomberg, HBR), Substack di creator seguiti, inbox Gmail
per newsletter non lette. Produce un report per contenuto: titolo, brief di
2 righe, chiave di lettura per il pubblico, voto di viralità 1-10, link.
Consultabile da una dashboard web fatta costruire a Claude Code. Effetto
collaterale non previsto: le idee migliori vengono dall'incrocio tra fonti
diverse nello stesso report. Costruzione a 3 livelli: versione base (30 min,
solo Reddit + Telegram via bot), intermedia (+ Firecrawl per testate, +
scan Gmail), avanzata (managed agent cloud + dashboard web).

## Fonti collegate
- Guida precedente: [[vignali-agenti-ai-guida-intro]]
- Guida successiva: [[vignali-secondo-cervello-obsidian]]
