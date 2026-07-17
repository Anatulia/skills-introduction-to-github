---
title: Confronto — Vault di Vignali vs LLM Wiki Pattern di Karpathy
type: synthesis
created: 2026-07-17
updated: 2026-07-17
sources: [vignali-secondo-cervello-obsidian, karpathy-llm-wiki-gist]
tags: [ai-agents, second-brain, comparison]
---

# Confronto — Vault di Vignali vs LLM Wiki Pattern di Karpathy

Due fonti indipendenti, con vocabolario e obiettivi diversi, descrivono
**la stessa architettura di fondo**: un agente LLM che mantiene un contesto
persistente e interlinkato in file Markdown locali, che si accumula nel
tempo invece di essere ricostruito a ogni query. Non risulta alcun
riferimento incrociato tra [[andrej-karpathy]] e [[dario-vignali]] nelle
fonti disponibili — convergenza indipendente, non derivazione.

## Punti in comune

| Elemento | Karpathy ([[llm-wiki-pattern]]) | Vignali ([[markdown-vault-second-brain]]) |
|---|---|---|
| Formato | File `.md` locali | File `.md` locali (vault [[obsidian]]) |
| Perché non RAG/app cloud | RAG rifà da zero a ogni query | Chiamate MCP verso app cloud sono lente/costose e possono troncare silenziosamente |
| Ruolo dell'IDE/vault | Obsidian = "IDE", LLM = "programmatore", wiki = "codebase" | Obsidian = vault, [[claude-code]] = agente che lo legge/scrive |
| Bottleneck riconosciuto | Bookkeeping (cross-reference, coerenza) | Formalizzazione (il 90% delle idee non scritte si perde) |
| Meccanismo di link | `[[wikilink]]` manuali/assistiti | `[[wikilink]]` scritti automaticamente dall'agente (whitelist) |
| Principio dichiarato | (implicito: persistenza vs RAG) | **"file over app"**, "always bet on text" |
| No vendor lock-in | Sì (file testuali, qualsiasi harness) | Sì, esplicitamente argomentato |

## Differenze principali

- **Karpathy** è deliberatamente **astratto**: un pattern/idea file, senza
  layout di cartelle o schema concreto forniti (vedi nota in
  `karpathy-llm-wiki-gist`). Il presente second brain (`CLAUDE.md`, questa
  struttura a 3 layer) è un'implementazione indipendente della community,
  **non validata da Karpathy**.
- **Vignali** è massimamente **operativo**: fornisce struttura di cartelle
  precisa (`tasks.md`, `MEMORY.md`, `references/` vs `knowledge/`, `calls/`,
  MOC), regole di routing automatico, casi d'uso quantificati (case study
  Mastermind, risparmio ore stimato), e persino un prompt "chiavi in mano"
  per costruire tutto con Claude Code.
- **Ambito.** Karpathy: knowledge base personale generica (qualsiasi dominio
  di conoscenza). Vignali: sistema operativo per un **imprenditore/creator**
  — task, delega al team, pipeline di contenuti, lanci di prodotto — un
  caso d'uso più verticale, orientato all'azione oltre che alla conoscenza.
- **Task vs conoscenza.** Il pattern di Karpathy (in questo second brain)
  non tratta esplicitamente le task operative; Vignali le rende un cittadino
  di prima classe del vault (`tasks.md`, routing automatico, distinzione
  task/memoria) — un'estensione che questo second brain potrebbe valutare di
  adottare se in futuro dovesse gestire azioni oltre alla conoscenza.
- **Chi mantiene il grafo dei link.** Karpathy: operazione di Ingest svolta
  dall'agente su richiesta. Vignali: automatizzata in tempo reale a ogni
  scrittura, tramite whitelist di nomi nel claude.md globale — un dettaglio
  implementativo che questo second brain non ha ancora adottato.

## Perché tenerlo in questo brain

È un esempio concreto di **convergenza indipendente**: due persone, contesti
diversi (ricerca AI vs marketing/imprenditoria), sono arrivate alla stessa
architettura di fondo (Markdown locale + agente che mantiene il contesto) per
lo stesso motivo tecnico (i file locali battono le app cloud/RAG in
velocità, costo e affidabilità per un LLM). Questo rafforza — non contraddice
— i principi già codificati in `CLAUDE.md` di questo second brain.

## Open questions
- Vale la pena importare in questo brain il layer "task" (tasks.md) del
  metodo Vignali, dato che qui non è ancora previsto?
- Il meccanismo di wiki-link automatico via whitelist (Vignali) potrebbe
  ridurre l'attrito rispetto al linking manuale/assistito attuale.

## Connections
- [[llm-wiki-pattern]], [[andrej-karpathy]]
- [[markdown-vault-second-brain]], [[dario-vignali]], [[obsidian]]

## Sources
- `vignali-secondo-cervello-obsidian`
- `karpathy-llm-wiki-gist`
