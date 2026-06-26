# Log — Second Brain History

> Append-only chronological record of ingests, queries, and lint passes.
> Newest entries at the bottom. Consistent prefixes keep it parseable.

## [2026-06-26] init
- Created the second-brain scaffold: 3-layer architecture (sources / wiki / schema).
- Added CLAUDE.md (operating schema), index.md (catalog), log.md (this file).
- Wiki subfolders: entities/, concepts/, syntheses/.
- Status: empty and ready for the first ingest.

## [2026-06-26] ingest | Karpathy "LLM Wiki" gist
- source: sources/karpathy-llm-wiki-gist.md
- touched: llm-wiki-pattern, memex, andrej-karpathy, qmd, marp, obsidian-dataview,
  obsidian-web-clipper, eidetic, okf-harness, community-projects-overview (10 pages)
- key facts filed: 3-layer architecture, ingest/query/lint ops, official tool stack.
- contradiction/flag: Karpathy did NOT endorse community projects (recorded on
  andrej-karpathy + community-projects-overview).
- data gaps: memex page unverified (Wikipedia 403); projectbrain.md unreachable (403).
- index.md updated → 1 source, 10 pages.

## [2026-06-26] tooling | qmd (Step 2 prepared)
- added tools/qmd-setup.md (verified install/usage from qmd README) and
  tools/qmd-index.sh (one-shot collection add + embed).
- updated entity [[qmd]] with install + integration notes.
- to run on Mac/PC (not the ephemeral remote env): install @tobilu/qmd,
  ./second-brain/tools/qmd-index.sh, then qmd search/vsearch/query; MCP via
  `claude plugin marketplace add tobi/qmd`.

## [2026-06-26] tooling | Dataview (Step 3 integrated)
- added dashboard.md (live Dataview views: by type, entities, concepts,
  syntheses, by-source, recently-updated, maintenance/orphans list).
- added tools/dataview-setup.md (install + vault-root note + frontmatter deps).
- linked dashboard from index.md; updated entity [[obsidian-dataview]].
- renders only in Obsidian with the plugin; code blocks on GitHub (expected).
