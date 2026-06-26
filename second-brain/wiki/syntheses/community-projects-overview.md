---
title: Community Projects & Tooling around LLM Wiki
type: synthesis
created: 2026-06-26
updated: 2026-06-26
sources: [karpathy-llm-wiki-gist]
tags: [overview, community, tooling]
---

# Community Projects & Tooling around LLM Wiki

Overview of the ecosystem that grew around the [[llm-wiki-pattern]]. **Key
caveat:** [[andrej-karpathy]] did **not** endorse or reply to any of these — they
are community work inspired by the gist (verified 2026-06-26).

## Official stack (recommended in the gist)
| Tool | Purpose | Page |
|------|---------|------|
| qmd | local hybrid Markdown search (CLI + MCP) | [[qmd]] |
| Obsidian Web Clipper | web → Markdown ingest | [[obsidian-web-clipper]] |
| Dataview | dynamic tables from frontmatter | [[obsidian-dataview]] |
| Marp | Markdown → slide decks | [[marp]] |
| Git | version history | (this repo) |
| Memex | conceptual ancestor | [[memex]] |

## Community implementations (studied in depth)
- [[eidetic]] — memory for AI coding agents; zero-config Claude Code hooks;
  auto-extraction + **drift detection**. Best reference for hook-based wiring.
- [[okf-harness]] — local-first CLI on Google's **OKF** portable format; layout
  mirrors our 3-layer schema. Best reference for **portability**.

## Other community projects (catalogued, not yet studied)
Synto, AutoSci, EchoesVault, Smriti-MCP, OpenClerk, Loremaester, Antinomia,
Nemsy, QiJu, trip2g, ProjectBrain.md, LLM Wiki Newsroom, FrameCode-VibeWork,
MindMux. (URLs in `sources/karpathy-llm-wiki-gist`.)

## Takeaway
For *this* second brain, the two most relevant references are **Eidetic**
(automated maintenance via Claude Code hooks) and **OKF Harness** (portable
folder-as-database). Our immediate roadmap follows the official stack, starting
with [[qmd]].

## Sources
- `karpathy-llm-wiki-gist`
