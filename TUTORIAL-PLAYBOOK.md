# Tutorial Playbook: project → beginner case study + series

How we turn a real project into publishable teaching content. Followed for
`networth-app`; reuse verbatim for every next project. The goal: a newcomer
to tech can read the hub and series and understand what was built, how each
part works, why each decision was made — with screenshots and a narrated
demo proving it runs.

## 0. Pick the project

- Source: `C:\project_inventory_v2\project_inventory.json`, top `PortfolioPotentialScore`.
- Record: project name, FullPath, stack, status. This becomes hub frontmatter.

## 1. Evidence pack (automated, read-only)

Run `tools/evidence-pack.ps1 -ProjectPath <path> -OutFile evidence-<slug>.md`.
It collects: git log, junk-skipped source tree, key manifests/configs (capped
at 64 KB), TODO/FIXME grep, test file list. Never reads `node_modules`,
`.git` internals, venvs, or files over the cap. Never executes project code.

## 2. Three-track archaeology (parallel, facts only)

Fan out three evidence passes with strict briefs — engine/logic, client/pages,
server/data — each returning file paths + line numbers, inferences labeled
INFERENCE, zero tutorial prose. Required outputs per track:

- **Engine:** module inventory (purpose, exports, formulas in words), test
  coverage map, untested modules, constants/thresholds quoted.
- **Client:** every route + one-line purpose, state ownership (context vs
  direct fetch), form/chart/PWA/theme facts, wizard mechanics, auth surfaces.
- **Server:** every route + methods, table inventory (or where DDL lives if
  not in source), sync/auth/import-export semantics, scripts inventory,
  root docs skimmed for architecture facts.

No writing begins until all three reports land.

## 3. Content architecture (fixed shape)

- **Hub** (`src/content/projects/<slug>.mdx`): pitch, evidence bar, demo,
  one architecture diagram, constraints section (extracted, never invented),
  Decision records (Problem/Options/Chosen/Why/Trade-offs/Result),
  What-didn't-work (resolved, evidenced attempts only — never pending work),
  MetricsTable, Timeline, series index. ~150 lines. It sells, proves, maps.
- Frontmatter must include `cover` (screenshot path), `language`, and
  `focus[]` (≤4 engineering-focus bullets shown on cards).
- **Six tutorial parts**, strict ownership (no duplication with hub or
  each other):
  1. Problem + constraints + tools table + architecture diagram.
  2. Core logic/engine: module inventory, key formulas in plain words.
  3. Backend/API/persistence: route table, validation, storage story.
  4. Client tour: every page, state ownership, forms/charts/theme/PWA.
  5. Hard topics (offline/sync/scale): the seam, the protocol, the tradeoffs.
  6. Capstone: full-flow recap, glossary of every term used, testing layers,
     stealable principles, "rebuild one slice yourself" exercise.
- Frontmatter: merged schema (SEO fields + `series`/`part`/`project`/`draft`).
  Cover image + primary language required for cards.

## 4. Beginner voice rules (non-negotiable)

- Define every piece of jargon on first use (frontend, API route, SQLite,
  Monte Carlo, zod…). Assume zero background, never talk down.
- Rhythm per section: concept → how this project does it → why (with the
  alternative it beat) → "habit worth copying" callout.
- Real code only, short excerpts, each with what/why/tradeoff notes.
- Tables for inventories, comparisons, formulas. Diagrams where words fail.
- **Never mention pending work, debt, or failures.** Tradeoffs are taught
  as decisions (problem → options → pick → why), never as confessions.
- One idea per paragraph. Fences get language labels automatically
  (expressive-code); no invented benchmarks, metrics, or screenshots.

## 5. Demo data first (privacy)

- Never record the real database. Copy it to scratch, wipe entity tables,
  seed coherent fiction via `db-seed` script (round numbers, modest scale,
  all entities the UI displays: assets, snapshots, goals, liabilities,
  transactions, check-ins, scenarios).
- Verify seeded coherence in-browser (totals, charts, no NaN/undefined rows;
  fix seed shapes to match UI expectations, e.g. scenario config keys).
- Keep the seed script — it is reusable infrastructure per project.

## 6. Screenshots (verified, not hoped)

- Run the app (dev server, warmed routes), capture hero flows with
  Playwright to temp (browser sandbox restricts output paths).
- **Read every screenshot** before accepting: reject loading skeletons,
  verify figures match the demo seed, check for glitches.
- Ship 3 gallery shots + hub hero (doubles as card cover + OG image).

## 7. Narrated video (scripted, reproducible)

- `record-*.cjs`: one clip per tab (separate contexts = separate files),
  content-gated waits (wait for real paint markers, never fixed timers),
  safe interactions only (scrolls, non-mutating clicks — never submit).
- `narration.ps1`: one figure-free section per tab (~25–35 words each, so
  narration survives data changes).
- `tts-gen.ps1`: Windows built-in TTS to WAV (document voice + rate).
- `mux-*.ps1`: trim clips to loaded tails, mux narration, timestamp-safe
  re-encoded join (never stream-copy concat).
- Verify 3+ spread frames + audio presence before shipping. Note duration
  in hub evidence bar + video caption.

## 8. Reusable components (do not reinvent)

ProjectHero (+image/caption), TechStack, ProjectMetadata, EvidenceBar,
ScreenshotGallery, DemoVideo, ArchitectureDiagram (Mermaid, token-themed),
CodeExample, Callout (decision/lesson/warning/evidence), Timeline,
LessonsLearned, ProjectCardImage (cover + language dot + badges),
TableOfContents, JsonLd, Lightbox. New needs → extend these, never fork.

## 9. Verification gate (every project, every time)

- [ ] `npm run build`: 0 errors.
- [ ] Internal-link audit script: 0 broken across all pages.
- [ ] Preview + console check: 0 errors on hub, one lesson, index.
- [ ] Lightbox opens with correct image; video element readyState 4.
- [ ] Mermaid renders in light + dark; theme toggle persists.
- [ ] 390px + 1440px screenshots reviewed; mobile menu works.
- [ ] JSON-LD parses on new pages; `llms.txt` includes new entries.
- [ ] No real secrets/figures anywhere (grep for real identifiers).
- [ ] Sitemap includes new URLs.

## 10. Publish

Stage, review `git status`/`git diff --stat`, commit with descriptive
message, push to `main` (Pages deploys automatically). Then: check Actions
green, spot-check 2 live URLs + `llms.txt`, submit new URLs in Search
Console. Real DB and demo DB must never mix — say so in the commit if
seed work was involved.
