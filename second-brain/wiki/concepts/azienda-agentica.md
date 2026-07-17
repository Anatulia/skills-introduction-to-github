---
title: Azienda Agentica (orchestratore + subagenti)
type: concept
created: 2026-07-17
updated: 2026-07-17
sources: [vignali-azienda-agentica-video]
tags: [ai-agents, architecture, multi-agent, business]
---

# Azienda Agentica (orchestratore + subagenti)

Architettura multi-agente per delegare interi processi aziendali ad agenti AI,
presentata da [[dario-vignali]] e [[pietro-virgilito]] con un caso d'uso
completo su [[claude-code]] (una digital agency che produce preventivi in
autonomia) (`vignali-azienda-agentica-video`).

## Key facts
- **Prerequisito:** auto-analisi aziendale — mappare processi e dati PRIMA di
  agentizzare ("non è plug-and-play"). Poi: compiti → procedure scritte;
  agenti → "assunzioni" con ruolo/competenze descritte.
- **Struttura:** un **orchestratore** (il `claude.md`, sempre in contesto:
  "non fai i lavori, li assegni") + subagenti specializzati in
  `.claude/agents/*.md` (frontmatter YAML: name, description, tools), ognuno
  con contesto chiuso e perimetro delimitato.
- **Probabilistico vs deterministico:** gli LLM ragionano e creano
  (probabilistico) ma NON computano ("mondo delle parole, non dei numeri");
  calcoli, date e letture strutturate vanno a **script deterministici**
  invocati come tool ("i totali non si fanno MAI a mente"). Script
  atomizzati, scritti dall'AI e cross-validati da un secondo modello.
- **Principio dei minimi privilegi** (dalla cybersecurity): ogni subagente
  riceve solo i tool che gli servono (es. analista = solo Read) — se
  allucina o viene manipolato, il danno resta confinato.
- **Comunicazione:** gli specialisti non si parlano (isolamento del
  contesto); l'orchestratore è un "passacarte fedele" (nessun riassunto tra
  un agente e l'altro). Parallelizzare solo task indipendenti; attenzione
  alle race condition. Il dialogo inter-agente (es. Agent Teams, in beta)
  dà autonomia ma toglie controllo.
- **Perché non un mega-prompt:** contesto sovraccarico e disomogeneo =
  più errori; la gerarchia informativa è l'equivalente dell'accountability
  aziendale (processo chiaro + responsabile chiaro).
- **Granularità:** né agenti-tuttofare né agenti da un'operazione sola
  (quella è un tool); si rifraziona quando un agente è sovraccarico, come
  un'azienda che separa i ruoli quando cresce.
- **Approccio incrementale:** piccoli moduli validati sul campo, poi
  orchestrati — partire dalla visione completa "da 0 a 100" fallisce.
  Valutare sempre il rapporto costo/beneficio dell'agentizzazione.
- **`settings.json`:** deny sulle operazioni distruttive + allow sugli
  script propri → la filiera gira senza human-in-the-loop.

## Connections
- Presentata da: [[dario-vignali]] + [[pietro-virgilito]]
- Implementata su: [[claude-code]] (subagenti, settings, tool)
- Estende a scala aziendale: [[ai-agent-loop]] (il "team di agenti" delle guide)
- Complementare a: [[ai-skills-sop]] (le procedure), [[context-engineering]]
  (il perché dei perimetri di contesto chiusi)
- Il caso Radar/dashboard come esempio incrementale: vedi
  [[dario-vignali-ai-agent-guides-overview]]

## Sources
- `vignali-azienda-agentica-video`
