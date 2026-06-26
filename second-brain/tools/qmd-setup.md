# Tool integration — qmd (Step 2)

Local hybrid Markdown search for this second brain. See entity page: [[qmd]].
Repo: github.com/tobi/qmd · package: `@tobilu/qmd`.

> Run these **on your Mac** (where the files and Obsidian live), not in the
> ephemeral remote session. Commands verified from the qmd README on 2026-06-26.

## 1. Prerequisites
- Node.js ≥ 22 **or** Bun ≥ 1.0.0
- macOS: Homebrew SQLite recommended (for FTS5 / extension support)

## 2. Install
```bash
npm install -g @tobilu/qmd      # or: bun install -g @tobilu/qmd
# no global install? use: npx @tobilu/qmd <args>
```

## 3. Index this brain
From the repo root, run the helper script (indexes the whole `second-brain/`
folder as a collection and builds embeddings):
```bash
./second-brain/tools/qmd-index.sh
```
Equivalent manual commands:
```bash
qmd collection add ./second-brain --name second-brain
qmd embed
```

## 4. Search
```bash
qmd search "drift detection"          # BM25 keyword
qmd vsearch "how knowledge compounds"  # vector / semantic
qmd query  "what is the llm wiki pattern"   # hybrid + LLM re-rank
```

## 5. Wire into Claude Code (MCP)
Option A — Claude Code plugin marketplace:
```bash
claude plugin marketplace add tobi/qmd
claude plugin install qmd@qmd
```
Option B — Claude Desktop config
(`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{ "mcpServers": { "qmd": { "command": "qmd", "args": ["mcp"] } } }
```
Background HTTP daemon (optional): `qmd mcp --http --daemon`

## 6. Re-index after ingests
qmd does not auto-watch. After adding sources/pages, re-run:
```bash
./second-brain/tools/qmd-index.sh
```
(Future: hook this into the ingest workflow — see [[eidetic]] for a hook-based
maintenance reference.)
