# MRXplorer — Project Context and Decision Log

This file (and its mirror, `AGENTS.md`) tracks business decisions behind the
MRXplorer site, not just code conventions. Site-restructuring changes are
usually business decisions in disguise — log them here so future sessions
don't have to reverse-engineer *why* the code looks the way it does.

Keep `CLAUDE.md` and `AGENTS.md` identical. If you update one, update both.

## What this repo is

Static marketing site (GitHub Pages) + a separate Netlify checkout app
(`class-checkout/`) for MRXplorer's live virtual AI classes for market
researchers. See `mrxplorer-build-plan.md` for the original architecture
writeup and `remaining-tasks.md` for the open task queue.

Two sources of truth drive what's actually for sale and when:

- `class-checkout/netlify/functions/catalog.js` — the **only** place that
  decides what's purchasable. If a class/cohort has no entry in `CATALOG`
  there, checkout rejects it server-side (see
  `create-checkout-session.js`, which does `CATALOG[item.name]` and fails
  closed on a miss). A class can be fully present on a page and still be
  unbuyable if it's missing here — that's the intended kill switch.
- `data/schedule.json` — the only place that decides class/cohort dates.
  `scripts/generate-schedule.mjs` reads it (plus
  `data/schedule-overrides.json`) and regenerates `data/generated-schedule.json`,
  `data/holiday-review.md`, and the embedded `GENERATED_SCHEDULE` /
  `GENERATED_COHORTS` blocks inside `class-checkout/index.html` and
  `class-checkout/leaders.html`. Run it after every edit to either JSON file.

## Decision Log

Most recent first. Each entry: **Decision**, **Why**, **Constraint**,
**Status**.

### 2026-07-27 — Classes catalog reduced to cohort-only (Beginner + Intermediate)

- **Decision:** Stop selling everything except two products: the
  **AI Beginners 4-Week Bundle (cohort)** and the **Intermediate AI 6-Week
  Cohort**, both on their existing September 2026 start dates. Everything
  else comes off the site as a purchasable/registerable offering:
  - All individual (non-cohort) Beginner and Intermediate classes.
  - The entire Leaders track — both its individual classes and its
    6-week Leadership Cohort.
- **Why:** Owner wants to narrow the live offering while deciding the
  future shape of the individual-class format. The individual classes may
  become recorded/on-demand classes instead of live virtual sessions, but
  that decision needs more time — this restructuring should not be read as
  "individual classes are cancelled forever," only "paused, pending a
  format decision."
- **Constraint:** No class content may be deleted. The default removal
  technique is to comment it out in place (`<!-- -->` in HTML, `//` in JS)
  rather than delete it, so removed sections stay in the same file and can
  be restored without guessing where they went. The Leaders track's own
  pages (`classes/leaders.html`, `class-checkout/leaders.html`) are left
  completely untouched as files — every *link* to them elsewhere on the
  site is commented out instead, and their catalog/schedule entries are
  commented out too so nothing is purchasable. The only exceptions, where
  the file format has no comment syntax, are `data/schedule.json` (strict
  JSON — entries are deleted, but documented in
  `classes-restructure-plan.md` and recoverable from git history) and the
  individual-class JSON-LD `Course`/`Offer` objects cut from `classes.html`
  (moved to `content/classes-archive/` instead of commented in place).
- **Status:** Leaders-track removal is a firm decision (classes + cohort,
  no exceptions). Individual Beginner/Intermediate class removal is
  temporary pending the live-vs-recorded decision — do not build a
  recorded-class version of anything until the owner explicitly decides to
  move forward with it. Execution steps: `classes-restructure-plan.md`.

<!-- Add new entries above this line, most recent first. -->
