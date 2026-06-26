---
title: qmd
type: entity
created: 2026-06-26
updated: 2026-06-26
sources: [karpathy-llm-wiki-gist]
tags: [tool, search, official-stack]
---

# qmd

Local search engine for Markdown files — the one CLI tool explicitly recommended
in the [[llm-wiki-pattern]]. Runs **100% on-device**.

- **Repo:** github.com/tobi/qmd
- **Author:** `tobi` (Tobias Lütke, Shopify CEO).

## Key facts
- **Hybrid search:** BM25 full-text (SQLite FTS5) + vector semantic (local GGUF
  embeddings) + LLM re-ranking, fused via Reciprocal Rank Fusion. Auto-expands
  queries into variations (original weighted 2×).
- **Interfaces:** CLI (`qmd search` / `vsearch` / `query`) and an **MCP server**
  (stdio + HTTP) for agent integration.
- **Install:** Node/Bun CLI — `npm install -g @tobilu/qmd`.
- **Role in the brain:** the search layer used when `index.md` alone isn't enough
  as the wiki grows. **Step 2 — integration prepared.** Setup guide:
  `tools/qmd-setup.md`; one-shot indexer: `tools/qmd-index.sh`. MCP wiring for
  Claude Code documented (plugin marketplace `tobi/qmd`). Run on the Mac/PC where
  files live (not the ephemeral remote session).

## Connections
- Core tool of: [[llm-wiki-pattern]]
- Part of: [[community-projects-overview]] (official-stack section)

## Sources
- `karpathy-llm-wiki-gist`
