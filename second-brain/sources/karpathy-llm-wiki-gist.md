# SOURCE — Karpathy "LLM Wiki" gist (captured 2026-06-26)

- URL: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- Author: Andrej Karpathy
- Created: 2026-04-04
- Note: This is a captured/cleaned copy for reference. Immutable — do not edit.

---

## LLM Wiki

A pattern for building personal knowledge bases using LLMs. An idea file meant
to be copied into your own LLM agent (Codex, Claude Code, etc.) and developed
collaboratively.

**Core idea.** Most people use LLMs over documents via RAG: upload, retrieve
chunks at query time, generate. It works but does not accumulate — knowledge is
rediscovered from scratch each query. LLM-Wiki instead has the LLM *incrementally
build and maintain a persistent wiki* — a structured, interlinked collection of
markdown files. Adding a source means reading it, extracting key info,
integrating it into existing pages, updating entity summaries, noting
contradictions, strengthening synthesis. The wiki becomes a persistent,
compounding artifact.

**Setup.** LLM agent on one side, Obsidian on the other. Obsidian = IDE, the LLM
= programmer, the wiki = codebase.

**Architecture (3 layers).** Raw sources (immutable) → the wiki (LLM-owned
markdown) → the schema (e.g. CLAUDE.md for Claude Code, AGENTS.md for Codex).

**Operations.** Ingest (one source may touch 10–15 pages); Query (answer with
citations; good answers can be filed back as new pages); Lint (health checks for
contradictions, stale claims, orphan pages, broken links).

**Navigation files.** index.md (content catalog, read first on query) and log.md
(append-only chronological record with parseable prefixes).

**Optional CLI tool.** qmd — local markdown search engine, hybrid BM25/vector +
LLM re-ranking, on-device, with CLI and MCP server.

**Tips & tricks.** Obsidian Web Clipper (web → markdown); download images locally
so the LLM can view them (Settings → Files and links → Attachment folder path,
hotkey Ctrl+Shift+D); Obsidian graph view; Marp (markdown slide decks); Dataview
(query frontmatter → dynamic tables); Git (free version history).

**Why it works.** "The tedious part of maintaining a knowledge base is not
reading or thinking — it's bookkeeping." LLMs don't fatigue or forget
cross-references; they touch 15 files in one pass. Relates to Vannevar Bush's
1945 Memex — personal curated knowledge with associative trails. "The part he
couldn't solve was who does the maintenance. The LLM handles that."

**Note.** Intentionally abstract — pattern, not implementation. No concrete
directory layout or schema template provided.

## Community (from comments — NOT endorsed by Karpathy)
Karpathy did not reply to or endorse any project in the thread. Notable
implementations: Synto, AutoSci, EchoesVault, Smriti-MCP, Eidetic, OpenClerk,
Loremaester, OKF Harness, Antinomia, Nemsy, QiJu, trip2g, ProjectBrain.md,
LLM Wiki Newsroom, FrameCode-VibeWork, MindMux.
