# Engineering Notebook

Personal engineering publication: real systems, documented with
architecture, evidence, and decisions. Built with Astro, hosted on
GitHub Pages at <https://xmirtunjay.github.io/engineering-notebook/>.

## What lives here

- `src/content/projects/` — case-study hubs (one per real project).
- `src/content/tutorials/` — multi-part series, grouped by `series` slug.
- `src/content/blog/` — essays (Writing).
- `src/content/experiments/` — hypothesis-first research notes with measured tables.
- `src/components/case-study/` — reusable case-study kit (hero, diagrams,
  galleries, video, callouts, decisions, metrics, timelines, lessons).
- `src/layouts/` — `Base`, `Article` (sticky scrollspy TOC + pager).
- `tools/evidence-pack.ps1` — read-only repo inspector feeding the
  tutorial pipeline.
- `docs/ENGINEERING_NOTEBOOK_DESIGN.md` — design spec (source of truth).
- `TUTORIAL-PLAYBOOK.md` — project-to-tutorial method (10 stages).

## Commands

| Command          | Action                                      |
| :--------------- | :------------------------------------------ |
| `npm install`    | Install dependencies                        |
| `npm run dev`    | Dev server at `localhost:4321`              |
| `npm run build`  | Static build to `./dist/` (17 pages)        |
| `npm run preview`| Preview the build locally                   |

## Conventions

- All internal links via `siteUrl()` (`src/lib/site.ts`) — the site lives
  under the `/engineering-notebook` base path.
- Frontmatter schemas in `src/content.config.ts`; drafts stay
  `draft: true` until reviewed.
- No placeholders in production. No invented metrics, screenshots, or
  dates. Sensitive data is seeded fiction, never real figures.
- Dark mode, TOC, Mermaid (on-demand), expressive-code, JSON-LD TechArticle,
  `llms.txt`, sitemap, RSS, robots.txt — all verified per release.
