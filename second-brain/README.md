# 🧠 Second Brain

A personal **LLM-Wiki**: a persistent, interlinked Markdown knowledge base that
an AI agent builds and maintains for me. Instead of re-discovering knowledge on
every question (classic RAG), the agent **accumulates** it — reading sources,
filing them into pages, cross-linking, and flagging contradictions — so the wiki
**compounds** in value over time.

Pattern inspired by Andrej Karpathy's "LLM Wiki" gist (Apr 2026). Independent
implementation, not endorsed by the author.

## How it's organized

```
second-brain/
├── CLAUDE.md          # the schema — tells the agent how to behave
├── index.md           # catalog of every page (read first on a query)
├── log.md             # append-only history (ingest / query / lint)
├── sources/           # raw, immutable source material (never edited)
└── wiki/              # agent-owned, generated pages
    ├── entities/      # people, projects, tools, companies, books…
    ├── concepts/      # ideas, themes, abstractions
    └── syntheses/     # comparisons, overviews, filed-back answers
```

## The three operations

- **Ingest** — add a source → the agent reads it and updates every affected page.
- **Query** — ask a question → the agent answers with citations, and can file
  good answers back as new pages.
- **Lint** — health check → find contradictions, stale claims, orphan pages,
  broken links.

## Usage

Open this folder with an AI agent (e.g. Claude Code) and Obsidian side by side:
the agent edits, you browse and follow links in real time. Obsidian = IDE,
the agent = programmer, the wiki = codebase.

> Roadmap: official tools will be wired in one at a time — **qmd** (local
> search), **Marp** (slides), **Dataview** (dynamic tables), **Obsidian Web
> Clipper** (web → markdown).
