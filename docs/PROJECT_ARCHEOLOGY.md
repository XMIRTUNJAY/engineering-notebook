# Project Archaeology — data-eng-mastery

Evidence record for the case-study series. Every claim below traces to
inspected source; labels FACT / INFERENCE / NOT VERIFIED are load-bearing.
Compiled 2026-09-05 from direct reads + three parallel code surveys.

## 1. What is this project? (FACT)

Exam-centric learning platform for data-engineering certifications
(Databricks DE Professional, AWS Data Analytics, CKA, Terraform Associate).
FastAPI async backend + Next.js frontend + Postgres/pgvector + Redis +
MinIO, Docker Compose locally. Spec-driven: 9 specs, 5 requirements docs,
9 ADRs, progress tracker, 10-job CI.

## 2. Underlying problem (INFERENCE from implementation)

Certification prep is static material plus disconnected quizzes, so study
effort can't be measured, weak areas stay invisible, and review timing is
guesswork. The system reduces this to: score command per concept
deterministically, schedule reviews by memory models, repair weakest first,
simulate the exam fairly.

## 3. Interactors (FACT)

Learners (web UI), content pipeline (offline jobs), Postgres (relational +
vector + FTS), Redis (idempotency, cache, locks, sessions), MinIO (blobs),
Stripe (billing webhooks), SMTP (email, optional), AI agents (MCP tools),
Obsidian (vault export), CI runners (10 jobs).

## 4–6. Inputs / transformations / outputs

Inputs: syllabus PDFs/HTML, curated YAML knowledge base, learner quiz
answers, review quality scores (0–5), study-plan targets, Stripe events.
Transformations: ingest→extract→generate→validate→publish→index→vectorize;
quiz history→mastery→weakness→recommendations→paths→exams; SM-2 reviews.
Outputs: published concepts/questions, mastery dashboards, due reviews,
mock exams with statistics, Obsidian vaults, agent tool answers, backups.

## 7. Component inventory (FACT, selected)

| Component | Purpose | Key files |
| --------- | ------- | --------- |
| API layer | 16 router groups, HTTP only | backend/app/api/v1/*.py |
| Services | Business logic (XP, badges, analytics) | backend/app/services/*.py |
| Algorithms | 6 pure modules, zero framework | backend/app/algorithms/*.py |
| Pipeline | 7 offline stages + DLQ | backend/app/pipeline/ |
| Knowledge | Vector/graph/MCP | backend/app/knowledge/engine.py |
| Models | UUID-keyed tables | backend/app/models/ |
| Schemas | Pydantic in/out contracts | backend/app/schemas/ |
| Migrations | 14 linear revisions, single head | backend/alembic/versions/ |
| Tests | 86 unit + integration + contract + locust | backend/tests/ |
| Knowledge base | 6 curated YAMLs (moat) | knowledge-base/*.yaml |
| Frontend | 23 Next.js routes (off-camera until E2E) | frontend/app/ |

## 8. Main execution path (FACT)

Learner answers quiz → POST practice/answer → zod-equivalent Pydantic
validation → service records attempt → mastery recalculated → weakness
re-ranked → recommendations refreshed → due reviews rescheduled → XP
awarded server-side → response. Slow path: pipeline job queued →
stages run with idempotency receipts → validators gate → publish bumps
version → indexes rebuilt.

## Requirements (FACT unless noted)

Functional: syllabus-aligned concepts, practice, flashcards + SM-2, mock
exams, study plans, progress analytics, badges/leaderboard, billing,
Obsidian export, MCP tools. Non-functional: deterministic learning loop
(no runtime LLM), 80% coverage floor (CI), linear migrations, JWT
rotation, rate limits, GDPR wipe, audit logging. INFERENCE: latency SLOs
not found in source — NOT VERIFIED as requirements.

## Constraints → consequence → response (FACT-based)

- No runtime LLM → deterministic algorithms; models confined to offline
  generation behind validators.
- Solo/small-team operation → one Postgres (rows+vectors+FTS) instead of
  three systems; Compose for local parity.
- Multi-month build → specs/ADRs/progress + 10 CI jobs.
- Money-adjacent billing → Stripe (never homegrown card handling).
- Exam fairness → seeded assembly, versioned content, hash-compared publish.

## Principles genuinely present (FACT)

Separation of concerns (router/service/model/algorithm), determinism
(learning loop), idempotency (pipeline receipts + 24h TTL), fail-fast
(ordered validators, boundary schemas), defense in depth (hash→validate→
version→audit), data lineage (content versions, audit logs, DLQ payloads),
reproducibility (seeded exams, exact unit assertions).
INFERENCE offered, not asserted: immutability (versions suggest it;
updates exist, so partial).

## Verified failure record (FACT — resolved items only)

1. Client-awarded XP gamed → server-side award (BUG-017 comment in
   `exams.py`; `50 + round(score*50)`).
2. Health v1 heuristics (95-point, milestone-driven) → v2 seven-factor
   100-point engine with pinning tests.
3. Zero test framework (2025-09-01 audit) → 86 unit tests, 4s runtime.
4. E2E rows (`E2E-PPF`, `E2E-mtjmfivt`) present in production-shape DB —
   test pollution without cleanup discipline (observed in inspected copy).
5. Duplicate test files (flat `tests/*.py` mirror `tests/integration/`)
   — observed; consolidation not attempted.

## Measurements actually executed (FACT)

pytest unit 86/86 (~4s), unit coverage 52% (engine 93–100%), ruff 774
findings (style/modernization-dominated), mypy blocked by 3.11-vs-3.12
config mismatch (pre-existing). Integration/contract/security figures are
CI-side — reported from workflow files, NOT VERIFIED by execution here.
