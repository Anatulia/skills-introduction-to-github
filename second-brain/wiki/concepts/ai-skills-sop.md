---
title: AI Skills (SOP per l'AI)
type: concept
created: 2026-07-17
updated: 2026-07-17
sources: [vignali-agenti-ai-guida-intro, vignali-team-di-agenti-ai]
tags: [ai-agents, automation, sop]
---

# AI Skills (SOP per l'AI)

Le **skill** sono, secondo [[dario-vignali]], l'equivalente per l'AI delle
SOP (Standard Operating Procedures) aziendali: file markdown che descrivono
l'esatto processo da seguire per un task ricorrente, così l'agente sa cosa
fare ogni volta senza bisogno di rispiegazioni (`vignali-agenti-ai-guida-intro`).
In [[claude-code]] vivono nella cartella nascosta `.claude/skills`.

## Key facts
- **Differenza skill vs memory** (vedi anche [[markdown-vault-second-brain]]):
  la memory salva preferenze generali ("il mio colore preferito è il blu");
  la skill impacchetta un intero processo specifico (come creare una
  proposta commerciale, come trasformare un transcript in articolo).
- **Due modi per crearle:** (1) descrivere un processo già noto/collaudato e
  chiedere all'agente di trasformarlo in skill; (2) eseguire il processo
  insieme all'agente manualmente una prima volta (con correzioni avanti e
  indietro) e poi chiedere "crea una skill per quello che abbiamo appena
  fatto".
- **Si concatenano.** Skill separate (transcript → articolo → post social →
  carosello Canva) possono essere orchestrate da una skill "madre" che le
  esegue in sequenza con un solo comando — esempio concreto: la Pipeline
  Contenuti in `vignali-team-di-agenti-ai`.
- **Effetto compounding:** ogni skill fa risparmiare tempo ogni volta che
  viene usata; accumulandone 2-3 a settimana, dopo un mese se ne hanno
  10-12, dopo sei mesi 30-40+ — un sistema che automatizza cose che prima
  richiedevano mezza giornata.
- Domanda-guida suggerita per identificare candidati a skill: "quali sono
  tutti i job-to-be-done ripetitivi della mia giornata?"

## Connections
- Applicate da: [[dario-vignali]] su [[claude-code]]
- Rende ripetibile: [[ai-agent-loop]]
- Distinta da (ma complementare a) la memoria di progetto in
  [[markdown-vault-second-brain]]

## Sources
- `vignali-agenti-ai-guida-intro`
- `vignali-team-di-agenti-ai`
