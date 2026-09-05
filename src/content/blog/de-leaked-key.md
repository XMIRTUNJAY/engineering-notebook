---
title: "The API Key Is Still in the Repo"
description: "A leaked NVIDIA key, a fix plan that claims remediation, and what grep says today: incident anatomy from the data-eng-mastery repository."
pubDate: 2026-09-05
---

import Callout from '../../components/case-study/Callout.astro';
import { siteUrl } from '../../lib/site';

The scariest line I read this week was not an error message. It was line 5 of a config file: a live-looking `nvapi-` key, sitting in plaintext, in a repository whose own fix plan marks the leak "done."

I will not quote the key here — not partially, not redacted-in-a-funny-way. If you take one habit from this article, take that one: leaked secrets don't belong in incident reports, screenshots, chat logs, or blog posts either.

## The situation

The data-eng-mastery backend talks to NVIDIA-hosted models through LiteLLM for its offline content work. That needs an API key. At some point the key was pasted directly into `config.yml` and a companion proxy file, `custom_proxy.py`, and both were committed. Git history here is three bulk commits all named "data engineering master project," so there is no commit that isolates the moment — the key simply exists in the record, in every clone, from the start.

A key in git is a special kind of leak: rotating it doesn't un-leak it. Every clone, every backup, every CI checkout holds a copy. The blast radius is unknowable, which is exactly why the response has to be total — rotate, remove, scrub — or honestly scoped.

## What I thought (reconstructing from the docs)

The repo's own `docs/FIX_PLAN.md` item P0.1 tells the story as the author understood it: rotate the key at the NVIDIA console, move both files to an `NVIDIA_API_KEY` environment variable, add the variable to `.env.example`, and scrub git history. Sound plan. It even records a wrinkle: history scrubbing was skipped by explicit user decision, with rotation named as "the actual remediation."

That last line is worth sitting with, because it contains a real judgment call: scrubbing rewrites every commit hash and breaks every checkout, so teams sometimes accept rotation-only and move on. Reasonable — *if* the rotation actually happened and the plaintext is actually gone.

## What broke (what I found today)

I ran the obvious check — search the repo for the key prefix — and got a hit: `config.yml:5` still carries a live-looking `nvapi-` value with no environment-variable indirection anywhere near it. The companion file, `custom_proxy.py`, is clean (it reads the env var with a runtime guard, exactly as the plan describes). So the remediation half-landed: one file fixed, one file still leaking, history unscrubbed by decision, rotation status unknown from inside the repo.

Let me be precise about what each piece of that means:

- **The key in `config.yml`:** FACT, verified by search today. Treat as live until rotated.
- **The clean proxy file:** FACT, verified the same way.
- **Whether the key was exploited:** unknowable from the repository. No access logs live here. Unknown means unknown.
- **Whether rotation happened:** not recorded anywhere I can find. Unknown.

## The investigation, in full

It took one command and two follow-ups. First, the prefix search across the repo (hit: one file, one line). Second, reading the surrounding lines to check for env indirection (none — a hardcoded string). Third, reading P0.1 to compare claim against reality (partial match: proxy done, config not, scrub deliberately skipped). Total time: minutes. That ratio — minutes to find, potentially months exposed — is the actual lesson about secrets: detection is cheap and always late, so prevention has to be structural.

What I ruled out: the `.env.example` additions exist (the plan's paperwork half is real), and there is no second key elsewhere in tracked files. What I did not do: test the key. Probing a possibly-live credential to "check" it is itself an incident. You rotate; you don't poke.

## The decision

| | Rotate only | Rotate + remove + scrub |
|---|---|---|
| Closes future abuse | Yes | Yes |
| Closes past copies | No | Mostly (clones may persist) |
| Cost | One console visit | History rewrite, broken checkouts |
| Chosen (per P0.1 note) | ✓ (user decision) | Skipped |

Rotation-only is defensible *after* removal lands everywhere. Right now the honest status is: not remediated — the plaintext is still committed. My recommendation: rotate at the NVIDIA console today, replace line 5 with the env reference, then decide about history with eyes open (the three-bulk-commit history makes a scrub unusually cheap here — little worth preserving).

## The fix (what "done" actually looks like)

1. Rotate the key at the provider console. Old key dies everywhere at once.
2. `config.yml` reads `NVIDIA_API_KEY` from the environment, like the proxy file already does.
3. Add a pre-commit secret scan so the next paste never lands (the repo has CI jobs for lint, types, and tests — a secret scan is one more gate in the same workflow).
4. Revisit the scrub decision with the rotation receipt in hand.

## Verification

How will I know it is fixed? `grep` for the key prefix returns nothing across all tracked files *and* the provider console shows the old key revoked — both halves, because each half alone lies. A clean grep without revocation leaves every existing copy dangerous; a revocation without cleanup leaves the next reader one `git log` away from confusion (and from testing whether old keys work — don't).

## What I missed (the article's real point)

The remediation failed in the most ordinary way possible: the fix plan described the end state, someone fixed one of two files, and the checkbox got checked against the plan instead of against the repository. **Verify against the artifact, never against the plan.** `grep` is the entire audit. It takes seconds, and this incident is what happens when nobody runs it.

## Principle worth keeping

A secret in git is compromised until proven rotated — and proven means evidence from the provider, not confidence from the plan. Docs describe intent. The repository describes reality. When they disagree, reality wins, and the doc gets an update, not the other way around.

## Evidence

- `config.yml:5` — live-looking key, no env indirection (verified 2026-09-05; key material deliberately not reproduced)
- `custom_proxy.py` — env-var read with runtime guard (verified clean same day)
- `docs/FIX_PLAN.md` P0.1 — remediation claim + skipped-scrub decision
- `git log --oneline` — three bulk commits, no granularity to isolate the leak

Related: the <a href={siteUrl('/projects/data-eng-mastery/')}>data-eng-mastery project page</a> (security review), <a href={siteUrl('/tutorials/data-eng-mastery/03-api-and-data/')}>Part 3: API and data model</a> (trust boundaries).
