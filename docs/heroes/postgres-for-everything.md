# Hero Specification — postgres-for-everything

## Article

`src/content/blog/postgres-for-everything.mdx` — "Postgres for everything:
rows, vectors, and text in one store".

## Core Problem

Three systems (Postgres + vector DB + search cluster) get adopted before any
measurement justifies them — three backups, three migration stories,
three 3 AM pages.

## Central Engineering Idea

Co-locate what you correlate: one Postgres holds rows, pgvector/HNSW
embeddings and tsvector text until an honest exit criterion trips.

## Visual Metaphor

A decision gate, not a pipeline — rendered wordlessly. Three thin lines
converge through a diamond into one vessel with a single accent bar:
three systems in, one store out. Typography (kicker, title, meta line)
carries all words; the image carries only geometry.

## Archetype

C — Decision Tree (single diamond, §5C of the hero brief).

## Entities

- PostgreSQL (rows), Vector DB (embeddings), Search cluster (full text)
- Decision: "measured need?"
- One store: PostgreSQL containing rows / vectors·HNSW / text·tsvector

## Relationships

- Candidates → gate (thin gray converging edges = options under review)
- Gate → store, labeled "no" (thick accent = chosen path)
- Gate → "yes → later" stub (dashed = deferred, not rejected)

## Engineering Decision

Implement hybrid search on the Postgres you already run; add pgvector,
one embedding column, tsvector GIN, JSONB — measure before a 2nd system.

## Trade-off

Gained: 1 backup · 1 migration · 1 pool, cross-workload joins stay free.
Sacrificed: single-pool contention at genuine scale; the 1024-dimension
contract (changing models migrates data, not just code).

## Signature Element

The single accent bar inside an otherwise monochrome vessel: the one store
among three candidates — the article's entire stance in one mark.

## Why This Visual

One sentence: "Don't buy three systems before measuring; one Postgres
until the exit criterion says otherwise." Every node and label is quoted
or paraphrased from the article (§13: no invented Kafka/Redis/services).

## SVG Structure

Handcrafted `public/blog/postgres-for-everything.svg` (1200×720, paper/
ink/gray/accent only, grayscale-safe). Protected from the cover generator
via `HANDMADE` in `tools/generate-blog-covers.mjs`. Served through the
standard `Article` hero slot, no template changes.
