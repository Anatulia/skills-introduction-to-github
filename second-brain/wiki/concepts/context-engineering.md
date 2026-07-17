---
title: Context Engineering
type: concept
created: 2026-07-17
updated: 2026-07-17
sources: [vignali-agenti-ai-guida-intro]
tags: [ai-agents, prompting]
---

# Context Engineering

Tesi di [[dario-vignali]]: il "prompt engineering" (formule/template per
scrivere il prompt perfetto) è diventato irrilevante rispetto al
**context engineering** — non conta più *come* chiedi, conta *quanto bene
hai caricato il contesto prima di chiedere* (`vignali-agenti-ai-guida-intro`).

## Key facts
- **"Context beats prompt, always."** Un agente senza contesto, di fronte a
  "Creami il mio sito web", deve chiedere tutto da zero e produce output
  generico. Lo stesso agente con contesto caricato (chi sei, il tuo pubblico,
  il tuo tono, i tuoi colori) produce risultati mirati con prompt di 2-3
  parole ("Scrivi la newsletter.").
- Il contesto si carica tramite: file `claude.md` (system prompt per
  cartella-progetto), cartella `references/` (conoscenza sintetica, caricata
  sempre), `memory.md` (preferenze/decisioni apprese nel tempo) — vedi
  [[markdown-vault-second-brain]] per l'architettura completa.
- Limite anche del contesto ben strutturato: copre solo ciò che è stato
  **formalizzato** esplicitamente. Le intuizioni mai scritte da nessuna parte
  restano fuori — motivo per cui [[dario-vignali]] ha esteso il sistema al
  vault Obsidian completo (daily notes, task, call) in
  `vignali-secondo-cervello-obsidian`.
- Creare il file `claude.md` di un progetto è descritto come un esercizio
  strategico di per sé: costringe a mettere per iscritto chi sei, cosa fai,
  quali sono le priorità in meno di 200 righe — un valore indipendente
  dall'uso con l'AI.

## Connections
- Applicato da: [[dario-vignali]] su [[claude-code]]
- Componente di: [[ai-agent-loop]]
- Esteso da: [[markdown-vault-second-brain]] (contesto non solo formalizzato
  a mano ma accumulato quotidianamente in un vault)

## Sources
- `vignali-agenti-ai-guida-intro`
