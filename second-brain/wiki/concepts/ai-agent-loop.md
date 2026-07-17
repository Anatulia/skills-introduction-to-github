---
title: AI Agent Loop
type: concept
created: 2026-07-17
updated: 2026-07-17
sources: [vignali-agenti-ai-guida-intro, vignali-team-di-agenti-ai]
tags: [ai-agents, pattern]
---

# AI Agent Loop

Il meccanismo di funzionamento di un agente AI, secondo [[dario-vignali]]:
un ciclo continuo **osserva → pensa → agisce**, che si ripete finché
l'obiettivo dato non è soddisfatto — a differenza di una chat, che risponde
una volta e si ferma (`vignali-agenti-ai-guida-intro`).

## Key facts
- **Chat (fase uno):** tu chiedi, l'AI risponde, tu fai il lavoro operativo
  (copi, incolli, formatti, pubblichi). L'AI è un consulente.
- **Agent (fase due):** tu dai un obiettivo, l'agente pianifica, esegue,
  verifica, consegna un risultato. Vantaggio stimato dall'autore: fattore
  10x-20x, cumulativo nel tempo.
- **4 componenti di ogni agente:** LLM (il cervello), il loop/le procedure,
  gli strumenti (via [[mcp-protocol]]), il contesto (vedi [[context-engineering]]
  e [[markdown-vault-second-brain]]).
- **Agent harness** (Claude Code, ChatGPT Codex, Claude Co-work, OpenClaw,
  Manus...) = piattaforme che implementano lo stesso loop con LLM/interfacce
  diverse — imparare i concetti trasferisce tra harness, come saper guidare
  trasferisce tra automobili.
- **Da un agente a un team:** più agenti specializzati, alcuni on-demand
  altri autonomi (schedulati), che comunicano in modo asincrono attraverso
  i file del [[markdown-vault-second-brain|vault]] anziché in tempo reale —
  esempi concreti: briefing mattutino, pipeline contenuti, radar di scouting
  (`vignali-team-di-agenti-ai`).
- Costruire un sistema di agenti richiede un investimento iniziale (settimane)
  che nelle prime fasi costa più tempo di quanto ne fa risparmiare — errore
  comune: giudicarlo "non funziona" dopo un solo pomeriggio senza contesto
  caricato.

## Connections
- Proposto/applicato da: [[dario-vignali]]
- Implementato su: [[claude-code]]
- Richiede: [[context-engineering]], [[mcp-protocol]]
- Reso ripetibile da: [[ai-skills-sop]]
- Scalato ad architettura aziendale in: [[azienda-agentica]]
- Concetto affine (agente che mantiene una base di conoscenza persistente)
  a [[llm-wiki-pattern]] — vedi confronto in [[vignali-vault-vs-llm-wiki-pattern]]

## Open questions
- Quanto il "fattore 10x-20x" sia misurato vs aneddotico (l'autore non cita
  benchmark, solo case study propri come il Mastermind).

## Sources
- `vignali-agenti-ai-guida-intro`
- `vignali-team-di-agenti-ai`
