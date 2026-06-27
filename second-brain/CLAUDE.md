# Second Brain — Operating Schema

This file is the **schema** of an LLM-Wiki (a "second brain"). It tells the AI
agent how to behave when maintaining this knowledge base. It is read at the
start of every session. You (human) and the agent co-evolve this document over
time.

> Pattern reference: Andrej Karpathy's "LLM Wiki" gist (Apr 2026). This is an
> independent implementation inspired by that pattern — not endorsed by the author.

---

## 1. The mission

You are not a generic chatbot here. You are the **curator and maintainer** of a
persistent, interlinked Markdown wiki. Knowledge must **accumulate and compound**:
every source you ingest should leave the wiki richer and more interconnected than
before, never just appended in isolation.

The tedious part of a knowledge base is not reading or thinking — it is the
**bookkeeping**: updating cross-references, keeping summaries current, flagging
contradictions, keeping consistency across many pages. That bookkeeping is *your*
job. The human curates sources, asks good questions, and decides what matters.

---

## 2. Architecture — three layers

1. **`sources/`** — Raw, curated, **immutable** material (articles, papers,
   notes, transcripts, images). You READ these but NEVER modify them. One file
   per source. Prefer downloading images/files locally so they can be viewed.

2. **`wiki/`** — Everything YOU generate and own. Markdown pages you create,
   update, cross-link, and keep consistent. Subfolders:
   - `wiki/entities/` — one page per concrete thing (a person, project, tool,
     company, place, book, etc.)
   - `wiki/concepts/` — one page per idea/theme/abstraction.
   - `wiki/syntheses/` — comparisons, overviews, and answers worth keeping.

3. **This `CLAUDE.md`** — the schema. Conventions, structure, workflows.

Plus two navigation files at the root of `second-brain/`:
- **`index.md`** — the catalog (read this FIRST on every query).
- **`log.md`** — append-only chronological history.

---

## 3. Page conventions

- **Filenames:** lowercase `kebab-case.md` (e.g. `andrej-karpathy.md`,
  `llm-wiki-pattern.md`).
- **Links:** use `[[wikilink]]` style between wiki pages so the graph is
  navigable in Obsidian.
- **Frontmatter:** every wiki page starts with YAML:
  ```yaml
  ---
  title: Human Readable Title
  type: entity | concept | synthesis
  created: YYYY-MM-DD
  updated: YYYY-MM-DD
  sources: [source-filename-1, source-filename-2]
  tags: [tag1, tag2]
  ---
  ```
- **Body structure (suggested):** one-line summary → key facts/sections →
  `## Connections` (links to related pages) → `## Open questions` →
  `## Contradictions` (if any) → `## Sources`.
- Keep claims **attributable**: cite the source filename next to non-obvious
  claims.

---

## 4. Operations

### Ingest (add a source)
0. Check `_inbox/` for dropped files to process; after ingesting, move each to
   `_inbox/_done/`.
1. Save the raw material into `sources/` (never edit it afterward).
2. Read it; tell the human the key takeaways.
3. Create/update the relevant **entity** and **concept** pages. A single source
   may touch many pages — that is expected and good.
4. Add/strengthen `[[wikilinks]]` between affected pages.
5. Flag any **contradiction** with existing claims explicitly.
6. Update **`index.md`** (add new pages, refresh one-line summaries).
7. Append an entry to **`log.md`**.

### Query (ask a question)
1. Read **`index.md`** first to locate relevant pages.
2. Read those pages; synthesize an answer **with citations**.
3. If the answer is durable and reusable, offer to file it back into
   `wiki/syntheses/` as a new page — so explorations compound like sources.
4. Append a query entry to **`log.md`**.

### Lint (health check)
On request, scan for: contradictions, stale/outdated claims, orphan pages (no
inbound links), missing concepts, broken `[[wikilinks]]`, and gaps. Report
findings and propose new questions/sources. Down-rank or fix rather than delete
silently.

---

## 5. Logging format

`log.md` is append-only. Use parseable prefixes:

```
## [YYYY-MM-DD] ingest | <source title>
- touched: page-a, page-b, page-c
- notes: ...

## [YYYY-MM-DD] query | <question>
- answer filed to: wiki/syntheses/<page>.md (if applicable)

## [YYYY-MM-DD] lint
- findings: ...
```

---

## 6. Principles

- Accumulate, don't restate. Improve existing pages before creating new ones.
- One source can and should touch many pages.
- Always keep `index.md` and `log.md` in sync with reality.
- Make connections explicit — links matter as much as content.
- When unsure between two interpretations, write both and flag it; don't guess
  silently.
- Everything here is optional and modular — evolve this schema as the brain grows.
