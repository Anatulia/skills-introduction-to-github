# 📊 Dashboard

> Dynamic views powered by the **Dataview** plugin. These render as live tables
> only inside Obsidian (with Dataview installed). On GitHub / plain Markdown they
> appear as code blocks — that's expected.
>
> Assumes the Obsidian **vault root = the `second-brain/` folder**, so paths are
> `wiki`, `wiki/entities`, etc. See `tools/dataview-setup.md`.

## All pages by type
```dataview
TABLE type, join(tags, ", ") AS tags, updated
FROM "wiki"
SORT type ASC, file.name ASC
```

## Entities
```dataview
TABLE join(tags, ", ") AS tags, sources, updated
FROM "wiki/entities"
SORT file.name ASC
```

## Concepts
```dataview
TABLE join(tags, ", ") AS tags, updated
FROM "wiki/concepts"
SORT file.name ASC
```

## Syntheses
```dataview
TABLE join(tags, ", ") AS tags, updated
FROM "wiki/syntheses"
SORT updated DESC
```

## Pages grouped by source
```dataview
TABLE rows.file.link AS pages
FROM "wiki"
FLATTEN sources AS source
GROUP BY source
```

## Recently updated (last 30 days)
```dataview
TABLE type, updated
FROM "wiki"
WHERE updated >= date(today) - dur(30 days)
SORT updated DESC
```

## Maintenance — possible orphans
> Pages tagged `core` should be well-linked; everything should connect back to a
> concept. Use this list during a **lint** pass to spot isolated pages.
```dataview
LIST
FROM "wiki"
SORT file.name ASC
```
