---
title: "The Validation Stage That Reports Zeros"
description: "A pipeline stage that returns hardcoded zeros, a fix plan that claims otherwise, and the rule: verify against the artifact, never the plan."
pubDate: 2026-09-05
---

import Callout from '../../components/case-study/Callout.astro';
import CodeExample from '../../components/case-study/CodeExample.astro';
import { siteUrl } from '../../lib/site';

Some bugs crash. This one reported success. The content pipeline's validation stage — the gate standing between generated lessons and learners — returned `validated: 0, passed: 0, failed: 0` no matter what flowed through it. Dashboards green. Logs quiet. Nothing validated. A gate that waves everything through while writing zeros in the ledger is worse than no gate: it spends the trust that gates exist to earn.

## The situation

The pipeline builds curriculum in seven stages (ingest → extract → generate → validate → publish → index → vectorize). Validation is the load-bearing one: generated drafts must pass seven ordered checks before learners ever see them. The tutorial series says so; the architecture says so. So I went to read the stage itself, in `backend/app/pipeline/orchestrator.py`:

<CodeExample
  title="The stub, verbatim"
  file="backend/app/pipeline/orchestrator.py: _run_validation"
  what="Fetches nothing, checks nothing, returns zeros — with an honest comment saying exactly that."
  why="This is the evidence. Everything below interprets it; nothing below alters it."
  tradeoff="Showing a three-line stub as the centerpiece risks understating the surrounding system. Kept small deliberately: the stub is the story."
>
```python
async def _run_validation(self, certification_id: str) -> dict:
    """Run validation on generated content."""
    validator = ContentValidator()

    # Get generated concepts from DB
    # For now, return placeholder
    return {
        "validated": 0,
        "passed": 0,
        "failed": 0,
    }
```
</CodeExample>

Note what redeems this code partially: the comment. `# For now, return placeholder` is honest. The numbers are lies, but the author labeled them temporary. Compare that with what a missing comment would mean — future readers assuming validation runs. Small honesty, large difference.

## What I thought

My first assumption, reading the tutorial series: validation runs — seven checks, ordered cheapest-first, failures stopping lessons before learners. My second input complicated it: the repo's `docs/FIX_PLAN.md` item P0.4a describes this exact stub and claims a rewrite returning an honest `{"status": "skipped", ...}` so admin logs reflect reality. Two documents agree the stub existed. They disagree about the present: the plan says fixed, the source says placeholder.

## What broke (what I found today)

The source wins. Read 2026-09-05: the placeholder is still there, zeros and all. So the actual state of the world is a three-way split — tutorials describe the intended seven-gate design, the fix plan describes a remediation, and the code describes a stub. Any reader who trusts exactly one document gets a different system than the one running. That split, more than the stub, is the incident: **documentation that disagrees with code, in both directions at once.**

To be fair about scope: this means generated content currently flows validate → publish without the seven checks executing in this path. Whether the validators run elsewhere (an admin path, a different stage wiring) is something I could not establish from the orchestrator alone — marked unknown below rather than asserted.

## The investigation

Short and mechanical: read the stage, read the plan item, compare, believe the code. The useful question wasn't "who's right" but "what would have caught this": the answer is the same one as ever — a test asserting that validation *runs* (not that it passes), or an admin dashboard showing per-stage outcomes where zeros would look as suspicious as they are. Metrics nobody reads are decoration; the zeros sat in returned dicts, presumably unread, doing their quiet damage to confidence.

## The decision

| | Wire the seven validators in now | Report honestly-skipped, wire later |
|---|---|---|
| Learner safety | Real gates immediately | Still unwired, but visible |
| Effort/risk | Large change, needs its own testing | Small, truthful status string |
| Chosen (per P0.4a) | — | **Honest skipped status** |

The plan's choice is the right intermediate: a gate that says "I am not running" beats a gate reporting zeros, because operators can reason about the former and only be fooled by the latter. But intermediate states need expiry dates, or "for now" becomes permanent — which is precisely what seems to have happened here. My recommendation: wire it or schedule it with a date, and until then let the status say skipped.

## The fix (recommended, not yet applied)

Replace the zeros with the honest skipped-status dict from P0.4a, then do the real wiring as its own tested change: validators in cost order, failures stopping the lesson, counts that add up. I am not presenting this as done — it isn't, as of this writing. An article that ends "and then I fixed it" when nobody did would be exactly the kind of fiction this series exists to refuse.

## Verification

Verified today: the stub text above is verbatim from current source; the P0.4a claim exists in `docs/FIX_PLAN.md`. Not verified: whether validators execute through any other path (searched the orchestrator only — unknown, stated plainly). The day the wiring lands, the proof will be a run whose validated/passed/failed counts sum correctly, plus a test that fails if the stage ever returns to constants.

<Callout type="warning" title="Standing recommendation">
  Treat this article as an open ticket with prose: wire `_run_validation` to the seven validators, or mark it skipped with a dated owner. The worst outcome is a fourth document describing a fifth state of the world.
</Callout>

## What I missed (as an investigator)

I nearly wrote this story from the fix plan alone — "team found stub, team fixed stub, lesson about honesty." The source check took thirty seconds and reversed the ending. **Read the code last in your process but first in your hierarchy**: docs tell you where to look, only the artifact tells you what is true. I almost published the plan's version. That near-miss is in here so I remember the order.

## Principle worth keeping

Stubs that report metrics are lies with good formatting. If a stage isn't wired, it should say "skipped" loudly enough that no dashboard can mistake it for success — and every "for now" needs a date, or it means forever.

## Evidence

- `backend/app/pipeline/orchestrator.py`, `_run_validation` — verbatim stub (verified 2026-09-05)
- `docs/FIX_PLAN.md` P0.4a — remediation claim (verified present, not landed)
- Missing: whether validators run via any alternate path; who owns the wiring; any date attached

Related: the <a href={siteUrl('/projects/data-eng-mastery/')}>data-eng-mastery project page</a> (pipeline), <a href={siteUrl('/tutorials/data-eng-mastery/04-content-pipeline/')}>Part 4: the content pipeline</a> (the intended design).
