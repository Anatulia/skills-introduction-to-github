---
title: Obsidian
type: entity
created: 2026-07-17
updated: 2026-07-17
sources: [vignali-secondo-cervello-obsidian]
tags: [tool, note-taking, second-brain]
---

# Obsidian

App gratuita di note-taking basata su file locali `.md` (non database
proprietario, non cloud terzo). La cartella di lavoro si chiama **vault**.
Il suo CEO è citato per il principio **"file over app"**: i file vengono
prima dell'app, le app passano, i file restano (`vignali-secondo-cervello-obsidian`).
Questo second brain (`llm-wiki-pattern`) e il sistema di [[dario-vignali]]
sono entrambi, indipendentemente, implementazioni pratiche dello stesso
principio "text over app" — vedi [[vignali-vault-vs-llm-wiki-pattern]].

## Key facts
- I file `.md` che genera sono identici, byte per byte, a quelli letti/
  scritti da [[claude-code]] — puntare i due strumenti sulla stessa cartella
  li fa condividere il contesto senza integrazione dedicata.
- **Wiki-link** `[[nome-file]]` tra note → nel tempo genera un grafo
  navigabile. Nel sistema di Vignali, Claude Code li scrive in automatico
  (whitelist di nomi univoci nel claude.md globale), eliminando l'attrito
  manuale di digitarli.
- **CLI di Obsidian** (attivabile in Impostazioni): canale che permette a
  Claude Code di interrogare Obsidian (quali file sono collegati, quali
  note menzionano un concetto).
- Plugin citati nel sistema di Vignali: **Tasks** (vista aggregata di
  checkbox task sparse nei file progetto, con emoji standard 📅⏫🔺🔽🔁✅),
  **Granola Sync Plus** (importa automaticamente le trascrizioni call nella
  cartella progetto giusta), **Bases** (viste tipo-database sopra i file,
  restando testo puro sotto).
- Nessun vendor lock-in: se si abbandona Obsidian, i file `.md` restano
  leggibili con qualsiasi editor — si perde solo la resa visuale del grafo,
  non i dati o i link (scritti comunque come testo `[[...]]`).
- Citato anche nel gist di Karpathy come parte dello stack (companion tool
  del pattern [[llm-wiki-pattern]]) — vedi [[obsidian-dataview]] e
  [[obsidian-web-clipper]], entrambi plugin/estensioni del vault Obsidian.

## Connections
- Usato come "vault" da: [[dario-vignali]]
- Condivide file con: [[claude-code]]
- Plugin/estensioni già in questo brain: [[obsidian-dataview]], [[obsidian-web-clipper]]
- Principio condiviso con: [[llm-wiki-pattern]] — vedi [[vignali-vault-vs-llm-wiki-pattern]]

## Sources
- `vignali-secondo-cervello-obsidian`
