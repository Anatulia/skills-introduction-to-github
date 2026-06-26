---
title: Obsidian Dataview
type: entity
created: 2026-06-26
updated: 2026-06-26
sources: [karpathy-llm-wiki-gist]
tags: [tool, obsidian, official-stack]
---

# Obsidian Dataview

Obsidian plugin that treats the vault as a **queryable database** — used in the
[[llm-wiki-pattern]] to build dynamic tables from page metadata.

- **Repo:** github.com/blacksmithgu/obsidian-dataview

## Key facts
- Reads metadata from **YAML frontmatter** and **inline fields** (`Key:: Value`).
- Query modes: **DQL** (SQL-like), inline expressions, **DataviewJS**, inline JS.
- Output: dynamic tables, filtered lists, grouped views, task compilations.
- **Role in the brain:** our pages already carry frontmatter (title/type/tags/
  sources) — Dataview can auto-generate views like "all entities by tag".
  **Step 3 — integrated.** Live views in `dashboard.md`; setup in
  `tools/dataview-setup.md`.

## Connections
- Companion tool of: [[llm-wiki-pattern]]
- Pairs with the frontmatter convention in `CLAUDE.md`
- Part of: [[community-projects-overview]] (official-stack section)

## Sources
- `karpathy-llm-wiki-gist`
