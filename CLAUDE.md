# MRXplorer — Project Context and Decision Log

This file (and its mirror, `AGENTS.md`) tracks business decisions behind the
MRXplorer site, not just code conventions. Site-restructuring changes are
usually business decisions in disguise — log them here so future sessions
don't have to reverse-engineer *why* the code looks the way it does.

`CLAUDE.md` is the canonical decision log. `AGENTS.md` is a symlink to this
file, so update `CLAUDE.md` only; both paths will stay synchronized.

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
  site is commented out instead. The two Leaders files stay at their paths,
  but their visible offering sections and registration controls are commented
  out in place and may show an unavailable message, so direct visitors do not
  see an active offering. Their catalog/schedule entries are commented out too
  so nothing is purchasable. The only exceptions, where the file format has
  no useful comment syntax, are strict JSON/plain-text data and the
  individual-class JSON-LD `Course`/`Offer` objects. Those entries are copied
  verbatim into `content/classes-archive/` before being removed from live
  output, as specified in `classes-restructure-plan.md`.
- **Status:** Cohort-only implementation and audit fixes are complete in the
  current worktree as of 2026-07-27. Final commit and live Stripe walkthrough
  are still pending. Site is cohort-only: Beginner ($395, 4-week) and
  Intermediate ($995, 6-week). Leaders-track removal is firm; individual class
  removal is temporary pending the live-vs-recorded format decision — do not
  build a recorded-class version until the owner decides to move forward.

<!-- Add new entries above this line, most recent first. -->
