# Tool integration — Dataview (Step 3)

Turns the vault into a queryable database, generating live tables from the YAML
frontmatter we already put on every page. Entity page: [[obsidian-dataview]].
Repo: github.com/blacksmithgu/obsidian-dataview.

> Dataview renders **only inside Obsidian** with the plugin installed. On GitHub
> the queries show as code blocks — that is normal.

## 1. Install (in Obsidian, any device)
Settings → Community plugins → Browse → search **"Dataview"** → Install → Enable.
(On iPhone/iPad it's the same flow in the mobile app.)

## 2. Vault root assumption
The queries in `dashboard.md` assume the **vault root is the `second-brain/`
folder** (so paths are `wiki`, `wiki/entities`, …). When you open the vault,
point Obsidian at `second-brain/`, not the repo root. If you instead open the
repo root, change `FROM "wiki"` → `FROM "second-brain/wiki"` in dashboard.md.

## 3. What it relies on (our frontmatter convention)
Every wiki page has:
```yaml
---
title: ...
type: entity | concept | synthesis
created: YYYY-MM-DD
updated: YYYY-MM-DD
sources: [..]
tags: [..]
---
```
Dataview reads these fields directly — keep them consistent (the `CLAUDE.md`
schema already mandates them).

## 4. Open the dashboard
Open `dashboard.md` in Obsidian → the tables populate automatically:
all-pages-by-type, entities, concepts, syntheses, pages-by-source, recently
updated, and a maintenance list for lint passes.

## 5. Tips
- Add new fields to frontmatter (e.g. `status:`, `confidence:`) and you can
  immediately query/sort by them.
- `dur(30 days)` window can be tuned.
- For richer views later: DataviewJS (full JS API).
