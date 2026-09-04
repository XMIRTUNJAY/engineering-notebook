---
title: "Exclusion-first traversal cut a filesystem scan by 77%"
description: "Three runs of a PowerShell project-discovery scanner show what happens when virtualenvs and dependency trees are pruned before descending instead of filtered after."
category: "Performance"
pubDate: 2026-09-04
status: "Complete"
hypothesis: "Checking exclusions before descending (rather than filtering results after) removes most of the work in a user-profile scan, because dependency trees dominate directory counts."
technologies: ["PowerShell 5.1", "Windows"]
tags: ["performance", "filesystem", "scanning", "tooling"]
featured: true
draft: false
---

## Question

A project-discovery scanner walks a Windows user profile (~300 GB disk, thousands of directories) looking for software projects. How much work is wasted inside directories that can never contain a project — virtualenvs, `node_modules`, `site-packages`, IDE caches — and what does pruning them up front actually save?

## Method

Ran the same scanner (`scan-projects-v2.ps1`, BFS queue, max depth 8) three times over `C:\Users\kumar`, changing only the exclusion logic between runs. Measured directories scanned, directories skipped, and project candidates each time.

## Results

| Run | Exclusion logic | Dirs scanned | Dirs skipped | Candidates |
| --- | --------------- | ------------ | ------------ | ---------- |
| 1 | Name blocklist only (`venv`, `node_modules`, `.git`, …) | 9,120 | 6,026 | 133 |
| 2 | + `pyvenv.cfg` / `conda-meta` subtree pruning, `site-packages` block, scan-root self-exclusion | 2,356 | 497 | 86 |
| 3 | + `.ipynb_checkpoints`, `.gemini` block | 2,072 | 493 | 80 |

Directories visited fell 77% (9,120 → 2,072). Wall time dropped from a long multi-minute scan to roughly two to three minutes on SSD.

## Observations

Run 1's name blocklist missed every virtualenv with a custom name (`tutor-env`, `.aider`, `crewai`, `funddoctor`) — 40+ of the 133 "projects" were NumPy/Pandas `site-packages` subfolders. The fix was structural, not a longer list: a directory containing `pyvenv.cfg` (or `conda-meta`) **is** an environment, regardless of its name, so the walker skips candidacy and never enqueues its children. `site-packages` as a hard block covers environments the marker check misses.

The candidate count fell 40% (133 → 80) purely by removing false positives — no detection rule changed. Precision improved without touching recall: every real project from run 1 survived into run 3.

One residual: `Desktop` and `Downloads` still match the fallback rule (3+ loose code files, no manifest) and are deleted from the output by hand. The honest fix is a directory-role rule (these are inboxes, not projects), noted as future work rather than silently patched.

## Conclusion

Hypothesis confirmed: in a user profile, dependency and environment trees dominate directory counts, and pruning before descent beats filtering after. The general rule: **exclude by role, not by name** — `pyvenv.cfg` beats maintaining a list of every way someone has named a venv.

## What I would test next

Content-hash dedup across the `fund_doctor` duplicate family (5+ copies in Downloads) to measure how much of the remaining 2,072 directories are duplicate trees, and a cold-cache run on HDD to see whether the 77% holds when I/O dominates.
