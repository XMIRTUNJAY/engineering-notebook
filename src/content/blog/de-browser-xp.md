---
title: "I Let the Browser Award XP. That Was a Mistake."
description: "Client-awarded rewards, forged progress, and the one-line comment that ended it: BUG-017 in the data-eng-mastery backend."
pubDate: 2026-09-05
---

import Callout from '../../components/case-study/Callout.astro';
import CodeExample from '../../components/case-study/CodeExample.astro';
import { siteUrl } from '../../lib/site';

The bug report, reconstructed: a learner's XP went up without the corresponding exam pass. Not a crash, not an outage — a number that lied. Those are the worst kind, because every downstream number (levels, ranks, streaks, recommendations) inherits the lie, and support tickets about wrong XP are inadjudicable once the system of record is the thing that lied.

## The situation

Data-eng-mastery awards XP for study actions, including passing mock exams: 50 points plus up to 50 scaled by score. XP feeds levels, the leaderboard, badges, and streaks. The original implementation let the browser — Priya's frontend — grant those rewards. The backend recorded whatever it was told.

## What I thought

The reasoning, as far as the code tells it: the browser already knows the score (it just rendered the exam), so having it report the reward saves a round trip and keeps the handler simple. Convenience presented as architecture. The mental model underneath — *the client is part of our system, so it behaves like our system* — is the exact assumption browsers exist to punish. They run on hardware you don't own, executing code the user can open, modify, and replay.

## What broke

Anybody could award themselves arbitrary XP with one crafted request — or hit it accidentally through retries and double-clicks, which is arguably worse, because then the corruption looks like ordinary data. There is no log line that distinguishes "earned" from "asserted" when the asserter is untrusted. The failure mode isn't just cheating; it's the quiet version, where numbers drift and nobody can say which ones are real.

## The investigation

Short, because the history left a marker. In `backend/app/api/v1/exams.py`, the submit path carries this comment today:

<CodeExample
  title="Server-authoritative rewards"
  file="backend/app/api/v1/exams.py:236"
  what="70% pass threshold; on pass, the backend awards 50 plus up to 50 scaled by score."
  why="The BUG-017 comment is the history: clients awarded XP before, clients can lie — the backend is now the source of truth."
  tradeoff="A deliberate import-cycle break inside the route; the alternative (client-trusted XP) is a cheat code waiting to happen."
>
```python
passed = score >= 0.7  # 70% passing threshold
exam.passed = passed
# BUG-017: award XP server-side on exam pass (backend is source of truth).
if passed:
    from app.services.game_state_service import record_exam_pass
    await record_exam_pass(db, current_user.id, 50 + round(score * 50))
```
</CodeExample>

The comment is doing three jobs: naming the bug number, stating the principle, and warning the next reader not to "simplify" it back. That is what a good history comment looks like — it makes the wrong code harder to write than the right code.

## The decision

| | Keep browser authority | Move XP server-side |
|---|---|---|
| Simplicity | Less code, fewer round trips | Import-cycle break, more backend responsibility |
| Trust | Any client can mint XP | Only graded passes mint XP |
| Auditability | Unverifiable after the fact | Every award traces to a graded exam row |
| Decision | Rejected | **Chosen** |

Nothing about this choice was close. "Simple" was doing real work in the original design — fewer moving parts, faster to build — and it had to be weighed openly against unfixable-after-the-fact corruption. The tiebreaker that ends these debates: which failure can you recover from? A complex handler can be simplified later. Forged history cannot be un-forged.

## The fix

Grading and awarding both happen in the submit handler, inside the request: compute the score from stored answers, threshold at 0.7, and only then call `record_exam_pass` with the formula. The browser's role shrank to displaying what the server decided. Note the deliberate import inside the route — slightly ugly, intentionally so, to avoid a module cycle. Ugly-in-the-open beats pretty-and-cheatable.

## Verification

The fix is verified by reading the current source: no exam-pass XP path exists that the client can invoke (verified 2026-09-05). What I did *not* do: execute a forged request against the running backend to watch it fail — the honest gap is a regression test that submits a fabricated pass and asserts zero XP. The comment prevents recurrence by convention; a test would prevent it by construction. Convention is weaker. That test belongs on the backlog, named after the bug.

## What I missed

I optimized for fewer round trips before asking who I was trusting. The general form of my error: **convenience presented as architecture.** Whenever "simpler" means "the untrusted party decides," simplicity is not a property of the design — it is a hole with good lighting. Now, for every write path, I ask first: who decides — client or server? — and the answer goes in a comment next to the code.

## Principle worth keeping

"The browser can calculate it" and "the browser should be trusted to calculate it" are completely different statements. The server owns rewards; the browser displays them. Name the source of truth per concern, in writing, next to the code — because the next person to touch that route will be optimizing for convenience again.

## Evidence

- `backend/app/api/v1/exams.py:236` — BUG-017 comment + server-side award formula (verified 2026-09-05)
- `backend/app/services/game_state_service.py` — `record_exam_pass` (verified present)
- Missing: the original client-awarded code (removed before this investigation); a forged-pass regression test (recommended, not yet written)

Related: the <a href={siteUrl('/projects/data-eng-mastery/')}>data-eng-mastery project page</a> (trust boundaries), <a href={siteUrl('/tutorials/data-eng-mastery/03-api-and-data/')}>Part 3: API and data model</a> (server decides, client displays).
