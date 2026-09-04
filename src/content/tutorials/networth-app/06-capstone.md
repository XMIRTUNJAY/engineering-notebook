---
title: "Capstone: the full picture, the vocabulary, the principles"
description: "How the layers fit together, every important term defined, how the project is tested, and six principles worth stealing for your own builds."
series: "networth-app"
part: 6
project: "networth-app"
category: "Finance / FinTech"
tags: ["testing", "architecture", "beginners"]
technologies: ["Vitest", "Playwright"]
difficulty: "beginner"
status: "Active"
featured: false
draft: false
pubDate: 2026-09-04
---

import Callout from '../../../components/case-study/Callout.astro';

## The full picture in one flow

Follow a single monthly check-in end to end: the wizard (Part 4) collects per-asset values → `fetch('/api/snapshots')` passes through the bridge (Part 5) to SQLite or Dexie → the route validates with zod and upserts (Part 3) → history is recalculated → shared state refreshes → the dashboard recomputes through the engine (Part 2) → charts repaint. Six layers, each owning exactly one job, each testable alone. If you understood that sentence, you understood the system.

## Vocabulary

Every term this series relied on, in one place:

- **Component** — a reusable UI piece (button, chart, page section).
- **API route** — a backend endpoint defined by a file; answers frontend requests.
- **CRUD** — Create, Read, Update, Delete: the four operations behind every list in the app.
- **SQLite** — a full database in a single local file; no server needed.
- **IndexedDB / Dexie** — the browser's built-in database, and the friendly wrapper used here.
- **PostgreSQL** — a production database server; used only for opt-in sync.
- **Snapshot** — one asset's recorded value for one month; the source of truth.
- **Derived data** — values computed from sources (history, net worth); recalculated, never hand-edited.
- **Pure function** — same inputs always give same output; no side effects; trivially testable.
- **Monte Carlo** — simulating 1,000 possible futures to report a spread instead of a guess.
- **p10/p50/p90** — pessimistic/median/optimistic percentiles of those simulations.
- **XIRR / CAGR** — true annualized return on irregular flows / smooth yearly growth rate.
- **FI number** — yearly spending ÷ withdrawal rate; the portfolio size that funds retirement.
- **Zod schema** — a runtime description of acceptable data shapes; rejects bad input at the boundary.
- **Last-write-wins** — conflict rule: newest timestamp stands, no merge UI.
- **Scrypt / session cookie** — salted password hashing, and the token the browser holds after login.
- **PWA / service worker** — installable app shell with offline caching strategies.
- **Migration** — versioned database schema change, applied in order.
- **Upsert** — insert-or-update in one operation, keyed to prevent duplicates.

## How it is tested

Three layers, each catching what the others miss: **unit tests** (vitest, 40/40) pin the engine math and file parsers to exact values; **smoke tests** drive the real API through full create-read-update-delete lifecycles; **Playwright end-to-end** scripts render pages, capture console errors, and walk the import flow with crafted spreadsheets. Manual QA passes are recorded in the repo docs. The habit: test the math exactly, the API behaviorally, the UI observably.

## Six principles worth stealing

1. **Write constraints before code.** Privacy, solo user, correctness, self-hosting — every tool choice traces back.
2. **Centralize math in pure functions.** One folder, no framework imports, each with tests. Wrong numbers have one address.
3. **One writer per derived dataset.** History is recalculated by the write path and by nothing else.
4. **Validate at the boundary.** Zod schemas shared by forms and routes: one definition of valid.
5. **Interpose, don't duplicate.** One 515-line seam gives two backends; duplicating fifteen pages would have cost thousands of lines.
6. **Seed your randomness.** Deterministic simulation buys exact tests and honest UI bands.

<Callout type="lesson" title=" where to go next">
  Rebuild one slice yourself: the savings-rate function, then its test, then a page that displays it. Then add a second database behind a three-line router. You will have reproduced this project's two most important ideas in an afternoon — and you will understand, from the inside, why structured projects feel calm while tangled ones feel loud.
</Callout>
