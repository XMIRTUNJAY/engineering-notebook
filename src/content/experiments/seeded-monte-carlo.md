---
title: "Seeded Monte Carlo: determinism check and seed sensitivity"
description: "Is a seeded wealth-projection engine bit-identical per seed, how far does the median move across seeds, and is 1000 simulations fast enough for the browser?"
category: "Finance Math"
pubDate: 2026-09-04
status: "Complete"
hypothesis: "A seeded LCG-based Monte Carlo engine returns bit-identical results for the same seed, varies only a few percent across seeds, and runs fast enough for client-side use."
technologies: ["TypeScript", "Node.js", "esbuild"]
tags: ["monte-carlo", "testing", "determinism", "wealthpath"]
featured: true
draft: false
---

## Question

The Wealthpath forecast engine (`src/lib/engine/montecarlo.ts`) uses a hand-rolled LCG plus Box-Muller draws and claims determinism via a `seed` parameter. Three things to verify: (1) same seed gives identical output, (2) how much the median moves across seeds, (3) whether 1000 simulations over 20 years is cheap enough to run in the browser on every input change.

## Method

Bundled the engine module with esbuild (3.2kb, no dependencies) and ran it under Node. Inputs: ₹1.16 Cr start, ₹1L/month contribution, 12% nominal return, 15% volatility, 6% inflation, 20 years, 1000 simulations. Ran seed 42 twice and compared full output; ran seeds 1–20 and recorded each p50; timed 5 consecutive 1000-sim runs.

## Results

| Metric | Result |
| ------ | ------ |
| Same-seed p50 identical | true |
| Same-seed full yearly series identical | true |
| p50 across seeds 1–20, min | ₹21.83 Cr |
| p50 across seeds 1–20, max | ₹23.94 Cr |
| p50 across seeds 1–20, mean | ₹22.87 Cr |
| 5 runs of 1000 sims × 20y | 155 ms (~31 ms per run) |
| probFI / medianYearToFI (no FI inputs) | null / null (correct: no target defined) |

## Observations

Determinism holds bit-for-bit, which is what makes `montecarlo.test.ts` possible — the test suite asserts on exact outputs, not statistical properties. Across seeds the median moves about ±5% around the mean: small enough that the p10/p50/p90 bands are stable, large enough that displaying a single point estimate would be dishonest. The bands are the honest UI, and this measurement justifies them.

At ~31 ms per 1000-simulation run, the engine is cheap enough to recompute on every keystroke in the scenarios page. No worker thread, no memoization layer needed — the performance question answers itself.

The null `probFI` behavior is worth noting as API design: without retirement-expense inputs there is no FI target, so the engine returns null instead of inventing one. Nullable results force the UI to handle the undefined case explicitly.

## Conclusion

Hypothesis confirmed on all three counts. The practical takeaway: seed every stochastic feature from day one. It costs one parameter and buys reproducibility, exact unit tests, and stable UI bands.

## What I would test next

Seed sensitivity at higher volatility (30%+) where I expect the cross-seed spread to widen, and whether 200 simulations (5× cheaper) keeps bands within 1% of the 1000-sim result — if so, mobile gets the lighter run.
