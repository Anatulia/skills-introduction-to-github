---
title: Claude Code
type: entity
created: 2026-07-17
updated: 2026-07-17
sources: [vignali-agenti-ai-guida-intro, vignali-team-di-agenti-ai, vignali-secondo-cervello-obsidian]
tags: [tool, ai-agent-harness, anthropic]
---

# Claude Code

**Agent harness** di Anthropic: prende un LLM (Claude), gli dà un loop
osserva-pensa-agisci, lo collega a strumenti esterni (via [[mcp-protocol|MCP]])
e a un contesto persistente su file locali. Concettualmente equivalente ad
altri harness (ChatGPT Codex, Claude Co-work, OpenClaw, Manus) — cambia
l'interfaccia, non i fondamentali. Lavora **in locale**, su cartelle del
computer, non nel cloud (`vignali-agenti-ai-guida-intro`).

## Key facts
- Ogni cartella-progetto può avere un file `claude.md` (system prompt
  caricato a ogni sessione: ruolo, contesto, preferenze, mappa file) e un
  `memory.md` (memoria persistente, aggiornata manualmente/su istruzione).
- Mostra visivamente il proprio loop di ragionamento durante il lavoro —
  secondo [[dario-vignali]] è il migliore per questo tra gli harness
  disponibili (`vignali-agenti-ai-guida-intro`).
- Legge file `.md` locali a "velocità di filesystem", in parallelo, senza
  il costo di latenza/token delle chiamate MCP verso app cloud (Notion ecc.)
  — vedi [[markdown-vault-second-brain]] (`vignali-secondo-cervello-obsidian`).
- Se puntato sulla stessa cartella di un vault [[obsidian|Obsidian]], legge e
  scrive gli stessi file `.md` — i due strumenti condividono il contesto.
  Richiede attivare la CLI di Obsidian nelle impostazioni per la comunicazione
  profonda tra i due.
- Supporta **skill** (file `.claude/skills/`, SOP riutilizzabili — vedi
  [[ai-skills-sop]]) e task/routine programmate (cron locale, trigger remoto).
- Usato da [[dario-vignali]] come harness centrale connesso a Gmail,
  Calendar, Notion, Stripe, Drive, Active Campaign, YouTube Studio,
  Granola, TranscriptAPI, Firecrawl via MCP.

## Connections
- Harness usato da: [[dario-vignali]]
- Legge/scrive: [[obsidian]] (stesso formato file)
- Abilita: [[ai-agent-loop]], [[ai-skills-sop]], [[mcp-protocol]]
- Confrontabile (stesso layer "agente che mantiene un wiki") con il pattern
  di [[andrej-karpathy]] — vedi [[vignali-vault-vs-llm-wiki-pattern]]

## Sources
- `vignali-agenti-ai-guida-intro`
- `vignali-team-di-agenti-ai`
- `vignali-secondo-cervello-obsidian`
