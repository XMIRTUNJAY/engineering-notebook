---
title: "The calculation engine: small math modules you can trust"
description: "Eight framework-free modules do every calculation. What pure functions are, what each module computes, and why tested math beats clever math."
series: "networth-app"
part: 2
project: "networth-app"
category: "Finance / FinTech"
tags: ["typescript", "monte-carlo", "testing", "beginners"]
technologies: ["TypeScript", "Vitest"]
difficulty: "beginner"
status: "Active"
featured: false
draft: false
pubDate: 2026-09-04
---

import Callout from '../../../components/case-study/Callout.astro';

## What is a pure function?

A **pure function** takes inputs, returns an output, and touches nothing else — no database, no screen, no clock. `add(2, 3)` always returns `5`. That property makes pure functions trivially testable: feed values in, assert values out. The engine rule in this project is simple — **all money math is pure functions**. The UI can be redesigned and the database can be swapped without touching a single formula.

## The eight modules

All live in `src/lib/engine/`, importable with zero framework, bundled to 3.2 kb with no dependencies:

| Module | What it computes, in plain words |
| ------ | -------------------------------- |
| `networth.ts` | Totals: assets minus liabilities; liquid vs investable slices; what changed and why |
| `cashflow.ts` | Monthly income, spending, and investment totals; trailing savings rate |
| `fi.ts` | Your FI number (yearly spending ÷ withdrawal rate), years until FI, Coast FI, emergency runway under stress |
| `montecarlo.ts` | 1,000 simulated futures → p10/p50/p90 bands, chance of reaching FI |
| `health.ts` | A 0–100 score from 7 transparent sub-scores (liquidity, savings, debt, runway, goals, diversification, history) |
| `insights.ts` | Rule-based insight cards ("savings above average") — plain `if` statements, no AI |
| `returns.ts` | XIRR (true annualized return on irregular cash flows), CAGR, savings rate |
| `goals.ts` | Goal projection, required monthly saving, on-track flag, what-if variants |

Two companions: `src/lib/io/csv.ts` parses spreadsheets without dependencies (7 tests), and `catalog.ts` holds country profiles — currencies, fiscal years, and return presets for IN and US.

<Callout type="lesson" title=" habit worth copying">
  Newcomers often scatter math through button handlers. Centralize it instead: one folder, pure functions, each with a test file. When a number on screen looks wrong, you know exactly where to look.
</Callout>

## Monte Carlo, simply

"Monte Carlo" sounds fancy; the idea is humble. Nobody knows future returns, so instead of predicting one future, the engine simulates **1,000 possible futures** with random market wiggles and reports the spread: p10 (bad luck), p50 (middle), p90 (good luck). The wiggles come from a tiny built-in random generator:

```ts
/** Simple LCG PRNG for determinism. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
```

The `seed` parameter is the teaching moment: same seed, identical results — which is what makes statistical code unit-testable (`montecarlo.test.ts` asserts exact outputs). Measured separately: seeds 1–20 move the median only ±5%, and 1,000 simulations over 20 years run in ~31 ms — cheap enough to recompute on every keystroke. That is why the UI shows **bands, never a single number**: the engine's own measurements prove point estimates would be dishonest.

## How savings rate actually works

Beginners meet three formulas here worth learning once and reusing forever:

- **Savings rate** = (income − expenses) ÷ income. The engine counts debt payments as expenses but excludes investments and transfers (`cashflow.ts`).
- **CAGR** = (end ÷ begin)^(1 ÷ years) − 1. One smooth yearly rate summarizing bumpy growth (`returns.ts`).
- **XIRR** = the rate that makes all dated cash flows net to zero, found by bisection (try 200 rates, zoom in). Handles irregular deposits that CAGR cannot.

## Why this structure wins

The UI imports the engine but the engine imports nothing from the UI — dependencies point one way. That single rule buys: tests that run in milliseconds, an experiment that bundled the engine standalone, and formulas a newcomer can read top to bottom. An older broader layer (`src/lib/finance.ts`, 542 lines, operating on database types) still exists alongside it — migrations take time, and the codebase is honest about being mid-migration. When you see two layers doing similar jobs, read the newer pure one first.

In Part 3 we follow a button click into the backend: API routes, validation, and the SQLite file.
