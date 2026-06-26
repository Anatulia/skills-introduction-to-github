---
title: Eidetic
type: entity
created: 2026-06-26
updated: 2026-06-26
sources: [karpathy-llm-wiki-gist]
tags: [project, community, memory, claude-code]
---

# Eidetic

Community implementation of the [[llm-wiki-pattern]] as a **long-term memory
system for AI coding agents**. One of the two community projects studied in depth.

- **Repo:** github.com/LARIkoz/eidetic
- **Status:** inspired by Karpathy, **not endorsed** (see [[andrej-karpathy]]).

## Key facts
- Tackles the "Day 1 problem" (agents forget between sessions) and "Day 60
  problem" (stale memories hurt performance).
- Markdown storage + hybrid FTS5 + vector search (e5-large, ~100 languages).
- Two memory types: **Personal (PUSH)** auto-injected into Claude Code;
  **Topic bases (PULL)** external corpora attached per project.
- **Zero-config Claude Code:** SessionStart/Stop hooks inject + auto-capture.
- Auto-extraction of typed signals (`Decision:/Rule:/Worked:/Failed:/Knowledge:`),
  AI-generated knowledge weighted 0.5× to avoid self-reinforcing hallucinations.
- **Drift detection** (broken wikilinks, 30+ day staleness, confidence
  escalation) → down-ranks stale memories instead of deleting.

## Why it matters to us
Implements the pattern end-to-end with **automated maintenance** on top — the
closest reference for wiring this brain into Claude Code via hooks.

## Connections
- Implements: [[llm-wiki-pattern]]
- Compare with: [[okf-harness]] — see [[community-projects-overview]]
- Relevant skill in this repo: SessionStart hooks (see project skills)

## Sources
- `karpathy-llm-wiki-gist`
