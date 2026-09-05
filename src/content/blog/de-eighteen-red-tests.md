---
title: "Eighteen Red Tests and One Shared Disease"
description: "Eighteen failures across four modules, one root cause: the service layer and the models disagreed about names and scales. From the data-eng-mastery fix record."
pubDate: 2026-09-05
---

import Callout from '../../components/case-study/Callout.astro';
import { siteUrl } from '../../lib/site';

The tests were red. Eighteen of them, across four modules — analytics, path finding, recommendations, concept service. The feature code looked reasonable. The models looked reasonable. The tests looked reasonable. And yet, red across the board. When failures spread that evenly, the bug is rarely in any one place. It is in the seam between two places that each look fine alone.

## The situation

The study engine's services compute over database models: attempts, progress rows, mastery scores. The repo's own `docs/FAILURE_FIX_REPORT.md` (2025-08-23) records the campaign that turned the suite green — 18 failures fixed, ending at 86/86. That document is the primary source for everything below; I verified the current green state and the surviving code patterns, not the keystrokes of the fix itself.

## What I thought (the original authors' model, reconstructed)

Somebody wrote the services against a mental model of the schema — `time_spent_seconds`, `quiz_attempts_count`, `mastery_level` as a 0–1 float — while the models said otherwise: `time_ms` (milliseconds), `quiz_total` / `quiz_correct`, `mastery_score` as a 0–1000 integer. Neither side was crazy. The service names read naturally; the model names are precise. The disease was the gap between them: **two vocabularies for one reality, with no compiler in between.** Python will not tell you that `quiz_attempts_count` doesn't exist until the query runs. The test suite is the only thing standing in that gap — and it was standing there flashing red, which means it was working.

## What broke

Concretely, from the fix record:

- **Analytics asked for columns that don't exist.** `time_spent_seconds`, `quiz_attempts_count`, `quiz_correct_count`, `mastery_level` — four invented names against real columns `time_ms`, `quiz_total`, `quiz_correct`, `mastery_score`. Every one an `AttributeError` at query time.
- **A filter compared across scales.** `mastery_level >= 0.7` against a column storing 0–1000. Every learner on earth scores above 0.7 out of 1000 — the filter passed everything, silently. This one never raised; it just lied. The quiet failures are always worse than the loud ones.
- **SQLAlchemy API misuse.** `func.case((condition, value), else_=0)` — `else_` isn't a valid parameter there. A library-signature guess, untested in isolation.
- **An inverted graph.** Path finding incremented the in-degree of the prerequisite instead of the dependent — Kahn's algorithm running backwards — plus a `get_depth()` with no cycle detection, i.e., infinite recursion on any cyclic graph. Two textbook algorithms, both wrong in ways the happy path never exercises.

## The investigation

The fix record shows the right shape of debugging: one failure class at a time, each traced to the seam, not the symptom. AttributeErrors → compare service names against model columns, rename to reality. Wrong filter results → check the column's actual scale, convert at the boundary (`mastery_score >= 700`, normalize output to 0–1). RecursionError → add the visited set. Wrong order → re-derive Kahn's properly. And several test expectations themselves updated where the tests had encoded the old, wrong response shapes — including the discipline to say so openly instead of quietly editing tests until green. (Editing a test to match broken code is always available and always wrong; the record shows response-structure changes, which is the legitimate case.)

What was ruled out along the way matters too: the failures were not flaky, not environmental, not ordering-dependent. Eighteen deterministic reds pointing at naming and scale — that pattern says "two authors" (or one author across two months), and the fix is reconciliation, not cleverness.

## The decision

There wasn't a dramatic fork in the road here — no Option A vs Option B table, because "rename to match reality" has no respectable alternative. The actual decision, and the one worth writing about: **fix the services to the models, not the reverse.** The database is the stored truth; migrations are expensive; services are cheap to edit. Direction of reconciliation matters — you always reconcile toward the thing that's hardest to change. (The one exception proves the rule: test expectations changed only where the *response contract* was being redesigned, a product decision, not a typo.)

## The fix

Renames to real columns. Scale conversions at the boundary with normalization on output. A visited set. A correct Kahn's. None of it clever — that is the point. The interesting diff isn't any single hunk; it's that eighteen failures collapsed into one diagnosis: **the seam had no guardian.** The guardian installed afterward was the suite itself, now green, plus (per the repo's CI) lint, types, and contract tests around it.

## Verification

`docs/FAILURE_FIX_REPORT.md` records 86/86 with per-module breakdowns (analytics 8, path finding 2, recommendations 4, concept service 1, plus remainder). I re-verified the headline number independently (86/86, 2026-09-05) and confirmed the surviving patterns in current source — including the dual-scale discipline the report installed (the mastery module still carries its timezone guard and documents both scales). What I did not do: re-run the suite against the pre-fix code to watch it fail. The report is detailed and internally consistent; treating it as the record is reasonable, and this sentence marks exactly where my verification ends and the document's begins.

## What I missed (what the authors missed first)

Nobody wrote down the column contract where both sides could see it. Models lived in one directory, services in another, and the names drifted because nothing forced them to agree except runtime. The general lesson, stated plainly: **every untyped seam between two vocabularies will eventually disagree, and the disagreement will look like eighteen unrelated bugs.** Schemas, shared types, contract tests — pick your guardian, but pick one before the suite has to play that role after the fact.

## Principle worth keeping

When failures spread evenly across modules, stop reading the failures and read the seams. And when the filter passes everything instead of crashing, be more afraid, not less — the loud `AttributeError`s were found in a day; a silent scale bug ships to learners.

## Evidence

- `docs/FAILURE_FIX_REPORT.md` (2025-08-23) — per-failure root causes and fixes (primary source)
- Current suite: 86/86 (re-verified 2026-09-05)
- `backend/app/algorithms/mastery.py` — dual-scale discipline present in current source
- Missing: pre-fix reproduction (relied on the fix record); per-module current counts beyond the headline number

Related: the <a href={siteUrl('/projects/data-eng-mastery/')}>data-eng-mastery project page</a> (measured results), <a href={siteUrl('/tutorials/data-eng-mastery/02-learning-engine/')}>Part 2: the learning engine</a> (the math under test).
