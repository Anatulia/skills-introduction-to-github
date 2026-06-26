---
title: OKF Harness
type: entity
created: 2026-06-26
updated: 2026-06-26
sources: [karpathy-llm-wiki-gist]
tags: [project, community, cli, portability]
---

# OKF Harness

Community implementation of the [[llm-wiki-pattern]]: a **local-first CLI** that
lets AI agents (Claude Code, Codex) maintain and query Markdown wikis. One of the
two community projects studied in depth.

- **Repo:** github.com/pumblus/okf-harness
- **Status:** inspired by Karpathy, **not endorsed** (see [[andrej-karpathy]]).

## Key facts
- Built on **OKF (Open Knowledge Format)** — Google's spec for portable Markdown
  knowledge bundles (markdown + structured frontmatter), so knowledge isn't
  locked into proprietary tools. Spec: GoogleCloudPlatform/knowledge-catalog.
- Folder *is* the database: raw sources under `raw/sources/`, synthesized pages
  under `wiki/` with explicit citations.
- Deterministic CLI commands return JSON; graph reports as self-contained HTML.
- One workspace per domain (privacy boundary).

## Why it matters to us
Its layout (`raw/sources/` + cited `wiki/`) closely mirrors our own 3-layer
schema — a good cross-check and a path toward **portability** if we ever leave
this repo.

## Connections
- Implements: [[llm-wiki-pattern]]
- Compare with: [[eidetic]] — see [[community-projects-overview]]

## Sources
- `karpathy-llm-wiki-gist`
