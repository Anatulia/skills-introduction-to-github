---
title: Markdown Vault come Second Brain (metodo Vignali)
type: concept
created: 2026-07-17
updated: 2026-07-17
sources: [vignali-secondo-cervello-obsidian, vignali-team-di-agenti-ai]
tags: [ai-agents, second-brain, obsidian, core]
---

# Markdown Vault come Second Brain (metodo Vignali)

Il metodo pratico di [[dario-vignali]] per costruire una "intelligenza
digitale" esterna: una cartella [[obsidian|Obsidian]] ("vault") di file
`.md` che funge sia da second brain personale sia da contesto vivo per
[[claude-code]], aggiornata quotidianamente e leggibile a "velocità di
filesystem" (`vignali-secondo-cervello-obsidian`). **Nota:** questo è un
metodo indipendente, con nome diverso, che converge sullo stesso principio
del [[llm-wiki-pattern]] già presente in questo second brain — vedi il
confronto in [[vignali-vault-vs-llm-wiki-pattern]].

## Key facts
- **Perché file locali e non app cloud (Notion/Todoist ecc.):** un agente
  legge `.md` locali in parallelo, in millisecondi, "come pensieri suoi";
  leggere da un'app cloud via [[mcp-protocol|MCP]] richiede una "chiamata
  telefonica" per pezzo di dato (autenticazione, latenza, token) — su
  richieste ampie (es. "trova pattern in un anno di note") l'agente può
  fermarsi a metà o coprire solo un sottoinsieme **senza dichiararlo**.
  Principio: "always bet on text" / **"file over app"**.
- **Componenti del vault:**
  - **Daily notes** — un file al giorno (~5 min), cattura pensiero grezzo
    altrimenti perso (intuizioni, decisioni, osservazioni).
  - **`tasks.md` per progetto** — task come checkbox Obsidian con emoji
    standard (scadenza/priorità/ricorrenza/completamento); si aggiungono/
    chiudono parlando con l'agente, che fa **routing automatico** nel file
    giusto secondo regole nel claude.md globale.
  - **Distinzione task vs memoria** — "fai X entro venerdì" (azionabile,
    tasks.md) vs "Marco preferisce WhatsApp" (informa decisioni future,
    MEMORY.md); mescolarle rompe la fiducia nel sistema.
  - **Apple Promemoria + skill `inbox-sync`** — cattura mobile senza
    categorizzazione (via Siri), poi smistata nel vault a comando.
  - **MOC (Map of Content)** — un file hub per progetto che linka tutti i
    file correlati; l'agente lo legge per primo per orientarsi senza
    esplorare a caso.
  - **Wiki-link automatici** — l'agente trasforma le menzioni testuali di
    entità note in `[[wikilink]]`, secondo una whitelist di nomi univoci.
  - **`references/` vs `knowledge/`** — sintetico e sempre-caricato vs
    lungo e caricato solo on-demand; motivo: il contesto ha un costo, troppo
    caricato confonde l'agente.
  - **Cartella `calls/`** — integrazione Granola + plugin "Granola Sync
    Plus": ogni riunione trascritta finisce automaticamente nel file
    progetto giusto, formato `YYYY-MM-DD-descrizione.md`.
- **Effetto "superpotere retroattivo":** con task, memorie, call e report
  tutti nello stesso vault, l'agente ricostruisce in ~30 secondi la
  sequenza operativa esatta di un evento passato (case study: lancio
  Business Genetics).
- **Case study Mastermind:** lancio annuale passato da 3-4 giorni pieni a
  "un decimo del tempo" grazie al contesto accumulato nel vault — output
  pronto per andare live, non bozze da rifinire.
- **Vault come "partner di pensiero":** riferimento a comandi Claude Code
  custom (aneddoto raccolto da un podcast di Greg Isenberg) che tracciano
  l'evoluzione di un'idea nel tempo o trovano ponti concettuali tra domini
  distanti nel vault — paragonato a un terapeuta ("non ti dice cosa
  pensare, ti aiuta a vedere cosa stai già pensando").
- **Ciclo quotidiano stimato:** ~10 minuti/giorno (5 min mattina + cattura
  sparsa) per un sistema che compounda nel tempo.
- **No vendor lock-in:** file `.md` restano leggibili con qualsiasi editor
  anche senza Obsidian.

## Connections
- Metodo di: [[dario-vignali]]
- Costruito su: [[obsidian]] + [[claude-code]]
- Abilita: [[ai-agent-loop]], [[ai-skills-sop]]
- Confronto diretto: [[vignali-vault-vs-llm-wiki-pattern]] vs [[llm-wiki-pattern]]

## Open questions
- Il metodo presuppone forte disciplina quotidiana di scrittura — l'autore
  stesso stima che "il 99% delle persone" non lo manterrà.

## Sources
- `vignali-secondo-cervello-obsidian`
- `vignali-team-di-agenti-ai`
