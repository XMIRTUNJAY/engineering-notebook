---
title: "Client tour: pages, shared state, and the app shell"
description: "All 15 pages, what shared state holds and why, how forms and charts stay consistent, and what makes the app installable and themed."
series: "networth-app"
part: 4
project: "networth-app"
category: "Finance / FinTech"
tags: ["nextjs", "react", "react-query", "pwa", "beginners"]
technologies: ["Next.js 14", "React 18", "React Query", "Recharts"]
difficulty: "beginner"
status: "Active"
featured: false
draft: false
pubDate: 2026-09-04
---

import Callout from '../../../components/case-study/Callout.astro';

## Pages are components

In React, the UI is built from **components** — reusable pieces like buttons, cards, and charts that combine into pages. Next.js turns files into pages by convention: `src/app/forecast/page.tsx` becomes the `/forecast` URL. Fifteen routes ship:

| Route | What you see |
| ----- | ------------ |
| `/dashboard` | Hero net worth, journey chart, recap, milestones, health score, next move, insights |
| `/portfolio` | Allocation pie, liquidity buckets, drift from targets |
| `/assets`, `/liabilities`, `/goals` | Lists with create/edit forms |
| `/forecast` | Projected wealth with sliders you can drag |
| `/fi` | FI calculator (Lean/Traditional/Fat/Barista) + Monte Carlo bands |
| `/scenarios` | Saved what-if comparisons |
| `/cashflow` | Income/expense/investment entries + monthly totals |
| `/checkin` | The 4-step monthly wizard |
| `/tools` | Stateless calculators (SIP, EMI, compound, inflation…) — no saving, just math |
| `/tools/import` | Spreadsheet upload: auto-map columns, preview the plan, commit |
| `/settings` | Country, currency, assumptions, local-mode toggle, login, backup/sync |
| `/privacy` | Export backup, wipe everything |

Every page sits inside an **AppShell**: sidebar on desktop, bottom nav on mobile, title bar on top. One shell, fifteen contents — navigation, fonts, and theme stay consistent for free.

## Why shared state exists

Without shared state, each page would fetch its own copy of the data and they would disagree. `NetWorthContext` is the single copy: it loads assets, snapshots, and goals once, then **derives** everything else with memoized selectors — latest snapshot per asset, monthly aggregates, per-category breakdowns. Components read from it instead of fetching.

Two supporting tools: **React Query** caches server fetches (5-minute freshness, one retry) so lists don't refetch on every click, and **react-hook-form + zod** validate forms with the same schemas the API uses — one definition of "valid," shared by frontend and backend.

<Callout type="lesson" title=" habit worth copying">
  When two screens show the same number, they must read from the same place. Beginners duplicate fetches; structured projects centralize state and derive the rest. If a number looks wrong, there is exactly one store to inspect.
</Callout>

## The wizard, step by step

The check-in is four screens — values, changes, notes, review — driven by a `step` number (1–4) plus per-asset entries. Next/Back move the step; on step 4, Next becomes Submit, which posts each entry as a snapshot, clears the form, and refreshes shared state. A progress bar shows `(step − 1) / 3`. If you own no assets yet, the wizard sends you to `/assets` first — the flow refuses to run on empty data.

## Charts, theme, installability

All seven charts are **Recharts** (React-friendly chart components) with one global style override, so every chart matches. The visual identity is a warm-paper theme with bronze accents and gold in dark mode, Inter for headings and JetBrains Mono for numbers. The app is installable (**PWA**): a manifest plus a service worker that precaches the shell routes — API calls try the network first with an offline fallback, pages load from cache. That is why airplane mode still shows your data.

## Open by construction

No page requires login — the only sign-in lives inside Settings, purely for cloud sync. Anyone with the URL and the machine sees everything. That is not an oversight; it follows from the privacy constraint in Part 1 (no cloud dependency means no gatekeeper). Local-first means the machine is the trust boundary.

In Part 5 we go deeper on the two hardest backend topics: working with no server at all, and syncing safely when a server exists.
