---
title: Obsidian Web Clipper
type: entity
created: 2026-06-26
updated: 2026-06-26
sources: [karpathy-llm-wiki-gist]
tags: [tool, obsidian, ingest, official-stack]
---

# Obsidian Web Clipper

Browser extension that captures web pages and converts them to **durable
Markdown** — the recommended fast path for *ingesting* web articles in the
[[llm-wiki-pattern]].

- **Repo:** github.com/obsidianmd/obsidian-clipper · Site: obsidian.md/clipper

## Key facts
- Browsers: Chrome, Firefox, Safari, Edge.
- Uses `defuddle` for extraction + `DOMPurify` for sanitizing.
- Templates/variables/filters; **local image storage** (Obsidian ≥ 1.8.0).
- **Role in the brain:** web article → `sources/` as clean Markdown, ready to
  ingest.

## Connections
- Ingest tool of: [[llm-wiki-pattern]]
- Part of: [[community-projects-overview]] (official-stack section)

## Sources
- `karpathy-llm-wiki-gist`
