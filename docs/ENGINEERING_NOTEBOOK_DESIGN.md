# Engineering Notebook — Design Specification

Source of truth for the redesign. Status: implemented (see audit §2);
this file governs future changes. Last updated 2026-09-05.

## 1. Product vision

A personal engineering notebook that documents systems actually built,
investigated, and measured — communicating "this engineer builds real
systems and understands why." Not a blog, not a SaaS landing page, not an
AI-generated portfolio.

## 2. Target audience

Senior/staff engineers, hiring managers, and curious builders. Secondary:
answer engines (ChatGPT/Claude) via llms.txt + JSON-LD. Beginners are
served by the tutorial track's defined-vocabulary voice, not by dilution.

## 3. Design principles

1. Content is the product; design makes engineering memorable.
2. Typography carries identity (serif display, sans body, mono meta/code).
3. Restraint over decoration: borders, not shadows; no gradients-as decor,
   no glassmorphism, no animation soup.
4. Evidence over claims: every number dated, every screenshot real,
   inferences labeled.
5. Repository is source of truth; "Not verified / Not measured" where apt.

## 4. Information architecture

```
/projects → /projects/[slug] (case-study hub + tutorial series index)
/blog → /blog/[slug] (Writing; Article shell)
/tutorials → /tutorials/[series] → /tutorials/[series]/[part]
/experiments → /experiments/[slug]
/about, /llms.txt, /rss.xml
```

Nav: Projects, Writing, Tutorials, Experiments, About + GitHub + theme
toggle + mobile hamburger. Tutorials stay top-level (real content lives
there); series are also indexed from project hubs.

## 5. Page structures

- **Home:** identity statement → featured projects (image cards) →
  latest writing → experiments → (footer). Compact sections, no giant hero.
- **Project hub:** kicker/title/lede → hero screenshot w/ caption →
  evidence bar → What → metadata → Why/constraints → demo (gallery+video)
  → architecture → decisions → what-didn't-work (resolved only) →
  timeline → series index (auto) → lessons teaser.
- **Tutorial part:** Article shell (kicker, meta, tags, TOC, pager).
- **Experiment:** hypothesis-first research note with measured tables.

## 6. Content model

Projects collection: title, description, repo?, demo?, stack[], category,
status, portfolioScore?, featured, draft, cover?, language?, focus[].
Tutorials: + series, part, project, difficulty, tags. Experiments: +
hypothesis, status. Blog: standard post fields.

## 7. Component architecture

Shell: SiteHeader, SiteFooter, Base, Article, Lightbox.
Cards: ProjectCardImage, RowCard. Case study: ProjectHero, TechStack,
ProjectMetadata, EvidenceBar, ScreenshotGallery, DemoVideo,
ArchitectureDiagram, CodeExample, Callout, Decision, MetricsTable,
Timeline, LessonsLearned, GitHubCard, RelatedContent.
Nav/content: TableOfContents, JsonLd. No forks — extend, never duplicate.

## 8. Visual system

Tokens in `styles/global.css`: paper/ink warm neutrals, indigo accent,
`--measure: 700px`, `--measure-wide: 1024px`, 8px radius, 1px borders.
Kickes 0.72rem mono tracked. Body 18px/1.7 (17px mobile). Dark theme
deliberately tuned, persisted, system-respecting, FOUC-free.

## 9–11. Article / project / experiment structure

Article: kicker → title → lede → meta → tags → body → pager; sticky
scrollspy TOC desktop, collapsible mobile. Projects per §5. Experiments:
Hypothesis → Question → Setup → Method → Results → Observations →
Conclusion → Next.

## 12–15. Evidence / screenshot / diagram / code requirements

- Evidence bar per hub (tests/screenshots/video/measured date).
- Screenshots: live runs only, every frame read before shipping, demo
  data for anything sensitive, captions mandatory on heroes.
- Diagrams: Mermaid, token-themed, purpose-built, never decorative.
- Code: real excerpts, expressive-code (label/copy), what/why/tradeoff
  notes on important snippets.

## 16–17. Responsive / accessibility

Breakpoints verified: 320/375/390/768/1024/1440/1920 (spot matrix).
Semantic HTML, single h1, aria labels on nav/dialog/menu, focus-visible,
alt text, keyboard-operable lightbox (native dialog), skip link in app
shells where present.

## 18–19. SEO / performance

Canonical, OG/Twitter, per-page OG images, sitemap, RSS, robots.txt,
JSON-LD TechArticle, llms.txt generated at build. Budgets (measured):
home ~11KB HTML, hub ~40KB, images lazy, Mermaid dynamic-import
(diagram pages only), one demo video max per hub.

## 20. GitHub Pages constraints

Fully static: no server, no DB, no SSR, no backend for any feature.
Base path `/engineering-notebook` — all links via `siteUrl()` helper.

## 21–22. Quality checklist / definition of done

Per TUTORIAL-PLAYBOOK.md §9, plus: spec file updated with any deviation,
design tokens untouched without reason, hostile review answers recorded
below.

## Appendix A — Audit of pre-redesign state (2026-09-04)

Kept: Astro + content collections + MDX + sitemap/RSS + Pages workflow.
Removed: template posts, legacy header/footer/layouts, hand-rolled copy
script (replaced by expressive-code). Fixed: config syntax error,
base-path link breakage, favicon 404s, Mermaid selector bug, duplicate
hub headers. Added: everything in §7 and hub depth (§5).

## Appendix B — Reference synthesis (no copying)

Leerob: minimal identity, dense row lists. Comeau: tutorial code
presentation, TOC. Stripe: editorial case studies. Vercel: polish,
template-card hierarchy (image → title → desc → badges). Cloudflare/
Netflix/Uber/GitHub: evidence density, measurement tables. Linear:
restraint and spacing discipline.
