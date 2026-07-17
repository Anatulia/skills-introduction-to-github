---
title: LLM Wiki Pattern
type: concept
created: 2026-06-26
updated: 2026-07-17
sources: [karpathy-llm-wiki-gist]
tags: [pattern, knowledge-management, agents, core]
---

# LLM Wiki Pattern

A pattern for personal knowledge bases where an **LLM agent incrementally builds
and maintains a persistent, interlinked Markdown wiki** instead of retrieving
from raw documents at query time. Knowledge **compounds**: each ingested source
leaves the wiki richer and more connected.

Proposed by [[andrej-karpathy]] in a gist (2026-04-04). This very second brain is
an implementation of it.

## Key facts
- **Vs RAG:** RAG rediscovers knowledge from scratch each query; the LLM-Wiki
  accumulates it. See [[rag-vs-llm-wiki]] reasoning in the synthesis.
- **3 layers:** raw sources (immutable) → wiki (LLM-owned) → schema (`CLAUDE.md`
  / `AGENTS.md`).
- **3 operations:** Ingest, Query, Lint.
- **Navigation:** `index.md` (catalog, read first) + `log.md` (append-only history).
- **Setup:** LLM agent + Obsidian side by side. Obsidian = IDE, LLM =
  programmer, wiki = codebase.
- **Why it works:** the bottleneck of knowledge bases is *bookkeeping*
  (cross-references, consistency), which LLMs do tirelessly.

## Connections
- Author: [[andrej-karpathy]]
- Intellectual ancestor: [[memex]] (Vannevar Bush, 1945)
- Recommended search tool: [[qmd]]
- Companion tools: [[obsidian-web-clipper]], [[obsidian-dataview]], [[marp]]
- Community implementations: [[eidetic]], [[okf-harness]] (see [[community-projects-overview]])

## Open questions
- What concrete directory layout works best? (Gist is intentionally abstract.)
- How to keep the schema (`CLAUDE.md`) from drifting as the brain grows?

## Related independent implementations
- [[markdown-vault-second-brain]] — Dario Vignali's "vault" method (Obsidian +
  Claude Code) converges independently on the same architecture (persistent,
  interlinked local Markdown as agent context vs RAG/cloud apps), with a more
  operational/verticalized scope (tasks, delegation, content pipelines).
  Full comparison: [[vignali-vault-vs-llm-wiki-pattern]].

## Sources
- `karpathy-llm-wiki-gist`
