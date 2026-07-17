# SOURCE — Dario Vignali, "Leggi questa guida e cambia per sempre il modo in cui usi l'AI" (captured 2026-07-17)

- Autore: Dario Vignali (Substack personale, ex dariovignali.net; fondatore Marketers/Business Genetics)
- Data pubblicazione: 27 mar 2026
- Origine file: Dropbox `Migrazione-PC-INCICO-2026-07/05-Personale/Personale/Analogista/Guida di Dario Vignali per Osidian+Agenti/`
- Nota: capture/sintesi condensata dal .docx originale. Immutabile — non modificare.

---

## Sintesi condensata

Prima guida di una serie di 4 su agenti AI + Obsidian. Tesi centrale: usare
chat (ChatGPT/Claude a colpi di copia-incolla) è "fase uno" — tu chiedi, l'AI
risponde, tu fai il lavoro operativo. Gli **agent** sono "fase due": dai un
obiettivo, l'agente pianifica, esegue, verifica, consegna. Vantaggio stimato:
fattore 10x-20x, cumulativo nel tempo.

**Agent loop.** Ogni agente = ciclo continuo osserva → pensa → agisce, finché
l'obiettivo non è soddisfatto. Esempio concreto: chiesto a Claude Code di
costruire un sito portfolio per il padre → l'agente ha cercato informazioni
online, pianificato la struttura, scritto il codice, aperto il browser per
verificare, corretto un bug di layout mobile, riverificato, consegnato — senza
intervento umano tra i passaggi.

**4 componenti di ogni agente:** (1) LLM (il "cervello": Claude, GPT, Gemini —
l'autore preferisce Claude), (2) il loop/le procedure, (3) gli strumenti
(Gmail, Calendar, Notion, Stripe, YouTube, filesystem, browser), (4) il
contesto (info su di te/business/preferenze — l'elemento che distingue un
agente generico da uno che "lavora come un membro del team").

**Agent harness.** Claude Code, ChatGPT Codex, Claude Co-work, OpenClaw, Manus
ecc. sono concettualmente la stessa cosa: un LLM + loop + strumenti + contesto,
con interfacce diverse. Analogia: imparare a guidare, non una macchina
specifica. Lavorano **in locale**, su cartelle del computer (non nel cloud) —
vantaggio enorme rispetto ai "Progetti" di Claude Web/ChatGPT.

**Struttura a cartelle.** Cartella madre (es. "CLAUDE") → sottocartella per
area/prodotto → sottocartelle per progetto. Ogni cartella-progetto ha un file
`claude.md` (o `gemini.md`/`agents.md` a seconda dell'harness) = system prompt
caricato automaticamente a ogni sessione: ruolo, contesto business, preferenze,
strumenti, mappa dei file. Consigliato tenerlo sotto le 200 righe, spostando
il resto in `references/`.

**"Context beats prompt, always."** Il context engineering ha sostituito il
prompt engineering: con contesto ben caricato bastano prompt di 2-3 parole.
Senza contesto, anche il prompt perfetto produce output generico.

**File memory.md.** Le chat cloud hanno memoria automatica non controllabile;
gli agent locali no — la memoria è manuale e va istruita esplicitamente
("leggi memory.md a inizio sessione, aggiornalo quando impari qualcosa").
Ogni cartella-progetto ha il proprio memory.md. Effetto compounding: più
regole accumulate, meno errori dell'agente nel tempo.

**Obsidian + agent harness = stessa cosa.** I file creati da Obsidian sono
file `.md`, identici a quelli letti/scritti da Claude Code. Si può puntare
Obsidian sulla cartella di Claude Code e viceversa: il second brain diventa il
contesto dell'agente.

**MCP (Model Context Protocol).** Creato da Anthropic. "Traduttore universale"
che permette agli agent di parlare con strumenti esterni (Gmail, Calendar,
Notion, Stripe, Slack...) senza integrazioni custom per ogni coppia.
L'autore ha collegato Gmail, Calendar, Granola, Notion, Stripe, Drive, Active
Campaign, YouTube Studio — e ha smesso di aprire i singoli tool, lavorando
solo dall'harness centrale.

**Stack a prova di futuro.** File markdown locali + strumenti via MCP. Nessun
vendor lock-in: cambiando piattaforma AI, cartelle e file restano.

**AIOS (AI Operating System).** Visione: un unico punto d'accesso (l'agente
personale) che si interfaccia con tutte le app al posto dell'utente. Cita
Cody Schneider: saremo "dipendenti 100x" con un sistema AI pre-costruito che
segue la persona da un ruolo all'altro.

**Skill = SOP per l'AI.** File markdown che descrivono un processo esatto da
seguire per un task ricorrente; l'agente li carica e sa cosa fare senza
rispiegazioni. Due modi per crearle: (a) descrivere un processo esistente e
chiedere all'agente di impacchettarlo in skill; (b) fare il processo insieme
manualmente una prima volta, poi chiedere "crea una skill per quello che
abbiamo appena fatto". Le skill si concatenano (transcript → articolo →
carosello → immagine...).

**Task programmati.** Harness come Claude Co-work permettono di schedulare
task ricorrenti (es. scan mattutino su Reddit + invio Telegram).

**Costo reale del setup.** Costruire un sistema di agenti richiede un
investimento iniziale (settimane) che nelle prime fasi costa più tempo di
quanto ne fa risparmiare — errore comune: giudicare "non funziona" dopo un
pomeriggio senza contesto caricato, come giudicare un nuovo dipendente il
primo giorno senza onboarding.

## Fonti collegate (menzionate nel testo)
- Guida 2: "Ho costruito un team di agenti AI che lavora per me" → [[vignali-team-di-agenti-ai]]
- Guida 3: "Crea il tuo secondo cervello e fai lavorare l'AI al posto tuo" → [[vignali-secondo-cervello-obsidian]]
- Guida newsletter: "Il Business delle Newsletter sta esplodendo" → [[vignali-business-newsletter]]
