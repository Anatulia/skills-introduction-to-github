---
title: Il sistema di agenti AI di Dario Vignali — overview
type: synthesis
created: 2026-07-17
updated: 2026-07-17
sources: [vignali-agenti-ai-guida-intro, vignali-team-di-agenti-ai, vignali-secondo-cervello-obsidian]
tags: [ai-agents, overview]
---

# Il sistema di agenti AI di Dario Vignali — overview

Sintesi delle 3 guide della serie AI di [[dario-vignali]] (mar-apr 2026),
lette in sequenza come un unico sistema che si costruisce a strati.

## I tre strati, in ordine di costruzione

1. **Un singolo agente con contesto** (`vignali-agenti-ai-guida-intro`) —
   [[ai-agent-loop|agent loop]] + [[context-engineering|contesto formalizzato]]
   in `claude.md`/`memory.md`/`references/` su [[claude-code]]. Livello base:
   l'agente conosce business, tono, dati — ma solo ciò che è stato scritto
   esplicitamente.
2. **Un team di agenti** (`vignali-team-di-agenti-ai`) — più agenti
   specializzati, on-demand o schedulati, che comunicano tramite file
   condivisi. Tre workflow concreti: briefing mattutino, pipeline contenuti,
   radar di scouting — costruiti come [[ai-skills-sop|skill]] concatenabili.
3. **Il vault come memoria totale** (`vignali-secondo-cervello-obsidian`) —
   [[markdown-vault-second-brain]]: estende il contesto formalizzato a *tutto*
   ciò che passa per la testa dell'utente (daily notes, task, call, idee),
   risolvendo il limite del livello 1 (il 90% delle intuizioni non
   formalizzate si perde).

## Il filo conduttore

Ogni strato risponde al limite di quello precedente:
- Il livello 1 risolve "l'agente non sa nulla di me" con il contesto scritto.
- Il livello 2 risolve "faccio sempre le stesse cose a mano" con team/skill.
- Il livello 3 risolve "il contesto scritto è solo la punta dell'iceberg"
  con un vault che cattura tutto, quotidianamente.

Argomento tecnico ricorrente in tutte e tre le guide: **file locali `.md`
battono le app cloud** per un agente — velocità (filesystem vs chiamate API),
costo (token), affidabilità (nessun troncamento silenzioso su richieste
ampie). Vedi [[markdown-vault-second-brain]] e [[mcp-protocol]].

## Perché è rilevante per questo second brain

Questo second brain (pattern [[llm-wiki-pattern]] di [[andrej-karpathy]]) e
il "vault" di Vignali sono due implementazioni indipendenti, con vocabolario
diverso, dello stesso principio: un agente che mantiene un contesto
persistente in Markdown, che compounda nel tempo invece di essere
ricostruito a ogni query. Confronto dettagliato in
[[vignali-vault-vs-llm-wiki-pattern]].

## Connections
- [[dario-vignali]], [[claude-code]], [[obsidian]]
- [[ai-agent-loop]], [[context-engineering]], [[ai-skills-sop]],
  [[markdown-vault-second-brain]], [[mcp-protocol]]

## Sources
- `vignali-agenti-ai-guida-intro`
- `vignali-team-di-agenti-ai`
- `vignali-secondo-cervello-obsidian`
