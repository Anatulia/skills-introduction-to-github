---
title: MCP (Model Context Protocol)
type: concept
created: 2026-07-17
updated: 2026-07-17
sources: [vignali-agenti-ai-guida-intro, vignali-team-di-agenti-ai]
tags: [ai-agents, protocol, anthropic]
---

# MCP (Model Context Protocol)

Standard creato da Anthropic che permette a un agente AI di comunicare con
strumenti esterni (Gmail, Calendar, Notion, Stripe, Slack, YouTube...) senza
costruire un'integrazione custom per ogni coppia strumento-agente
(`vignali-agenti-ai-guida-intro`). Descritto da [[dario-vignali]] con
un'analogia da podcast: se ogni strumento parlasse una lingua diversa
(Claude inglese, Notion spagnolo, Gmail francese...), prima serviva un
traduttore dedicato per ogni coppia; MCP è il traduttore universale
collegato una volta sola.

## Key facts
- In [[claude-code]] si configura tramite file di configurazione; in Claude
  Co-work tramite "connettori"; in Codex tramite "skills" nelle impostazioni.
- Esempi di MCP usati da [[dario-vignali]]: Gmail, Google Calendar, Granola
  (note riunioni), Notion, Stripe, Google Drive, Active Campaign, YouTube
  Studio, **TranscriptAPI** (estrazione sottotitoli YouTube, pochi centesimi
  a video), **Firecrawl** (lettura di qualsiasi sito web).
- Effetto pratico riportato: dopo aver collegato tutto via MCP, l'autore ha
  smesso di aprire i singoli tool — lavora solo dall'harness centrale, che
  si occupa del resto (es. confronto performance email/Stripe in 30 secondi
  invece di un'ora di export manuale).
- Limite pratico segnalato altrove (in `vignali-secondo-cervello-obsidian`,
  vedi [[markdown-vault-second-brain]]): leggere molte note via MCP da
  un'app cloud (es. Notion) è lento e costoso in token rispetto a leggere
  file `.md` locali — ogni nota richiede una "chiamata telefonica"
  separata, e su richieste ampie l'agente può fermarsi o esplorare solo un
  sottoinsieme senza dichiararlo.

## Connections
- Standard usato da: [[claude-code]] e altri harness — vedi [[ai-agent-loop]]
- Complementare (non sostitutivo) a: [[markdown-vault-second-brain]]

## Sources
- `vignali-agenti-ai-guida-intro`
- `vignali-team-di-agenti-ai`
