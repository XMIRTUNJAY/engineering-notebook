---
title: "I inventoried 80 projects on my own hard drive"
description: "How an exclusion-first PowerShell scanner, deterministic scoring, and honest caveats turned 300 GB of accumulated side projects into a triage-able inventory."
pubDate: 2026-09-04
---

Years of side projects accumulate into archaeology: Desktop folders, Downloads zips, half-finished tutorials, five copies of something called `fund_doctor`. I wanted an inventory I could hand to an LLM and triage — resurrect, combine, document, open-source, portfolio, or abandon. So I built a scanner. Twice. The first version was unreliable; this is what the rewrite taught me.

## Exclude by role, not by name

The first run reported 133 "projects." Forty of them were NumPy subfolders. My blocklist had `venv` and `envs`, but real environments are named `tutor-env`, `.aider`, `crewai` — no list survives contact with actual humans.

The fix that mattered:

```powershell
if ($nm -ieq "pyvenv.cfg" -or $nm -ieq "conda-meta") { $isEnvDir = $true }
```

A directory containing `pyvenv.cfg` **is** a virtualenv regardless of its name. The walker then skips candidacy and never enqueues its children. Directories visited fell 77% across runs (9,120 → 2,072) and false positives dropped 40% — without changing a single detection rule. Precision improved; recall untouched.

## Score confidence and potential separately

Two numbers, different meanings. `ProjectConfidenceScore` (0–100): how sure are we this folder is a project — git, README, manifest, code count, tests, Docker/CI. `PortfolioPotentialScore`: how interesting might it be — AI/data/finance category, multiple languages, docs, GitHub remote, recent activity. Both deterministic, both labeled heuristic. The LLM does the real judging later; the scores just order the queue.

## Duplicates are a feature of the data

`mf360-academy-site` exists in two places. There are five `fund_doctor` variants. Name-normalized grouping (`-copy`, `-final`, `-v2` suffixes stripped) catches these conservatively. Nothing is deleted — the inventory just says "look at these together."

## Keep the caveats in the output

The scanner's own report admits: `Desktop` and `Downloads` match the fallback rule and must be deleted by hand; the AI/ML category count is inflated by greedy keyword matching. A tool that documents its own weaknesses gets trusted. One that hides them gets re-run by someone suspicious.

The full pipeline — scanner, inventory, and the case-study workflow it feeds — is described across this site's projects section. The inventory itself: 80 projects, 27 git, 53 not, 45 active.
