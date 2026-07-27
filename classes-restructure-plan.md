# Classes Restructure Plan — Cohort-Only (Beginner + Intermediate)

Execution plan for the decision logged in `CLAUDE.md` / `AGENTS.md`
(2026-07-27 entry). Written to be run phase-by-phase by any model, including
a cheaper one, without needing to make judgment calls. Each phase lists
exact files, exact strings to find, and how to check the phase worked before
moving to the next one. **Do the phases in order** — later phases assume
earlier ones are done (e.g. Phase 4's catalog prune is what makes Phase 3's
"unlinked" pages actually unpurchasable).

Do not skip the "Verify" step in any phase. Do not batch multiple phases
into one commit — commit after each phase so a bad phase is easy to revert.

## What "removed" means here (read this before touching anything)

**Default technique: comment out in place, don't relocate.** Anything a
visitor could otherwise see or click must stop rendering, but the markup
stays in the same file, wrapped in `<!-- -->`, so a `git diff` or a plain
text search still finds it and it can be un-commented later with no
guesswork about where it goes back. Three exceptions, because the file
format doesn't support comments where the content lives:

1. **Whole-page removal (Leaders track):** `classes/leaders.html` and
   `class-checkout/leaders.html` are entire files dedicated to Leaders
   content. Do **not** move, rename, delete, or comment-out-in-full these
   files — leaving the file exactly as it is *is* the preservation. Cut
   every link to them from the rest of the site (those links are the
   "visible to visitors" part, and those get HTML-commented) and remove
   their catalog/schedule entries so nothing can find them or buy from
   them. This is Phases 3–4 below.
2. **JSON-LD structured data:** JSON has no comment syntax, so individual
   objects inside a `<script type="application/ld+json">` block can't be
   commented out one at a time while leaving the rest valid. The whole
   `<script>...</script>` tag *can* be wrapped in an HTML comment, but
   JSON-LD is metadata for crawlers, not something a visitor sees anyway —
   what actually matters for "don't tell search engines/AI crawlers these
   classes are for sale" is that the stale `Course`/`Offer` objects are out
   of the live JSON-LD, full stop. Phase 1 cuts the 10 individual-class
   `Course` objects out of `classes.html`'s JSON-LD and preserves them in a
   small archive file instead, since there's no in-place way to do it.
3. **`data/schedule.json`:** strict JSON, no comments. Entries removed here
   are gone from the file; the exact removed entries are already documented
   verbatim in this plan's Name Reference section and in git history, so
   nothing is actually lost — just not comment-preserved in place. Phase 6.

Everything else — class cards, nav links, CTA buttons, catalog/schedule
data written in JS (which does support comments) — gets wrapped in a
comment in place. This is Phases 2–5 below.

## Name reference (exact strings — use these verbatim in searches)

**Kept for sale (do not touch pricing/catalog entries for these):**
- `AI Beginners 4-Week Bundle (cohort)`
- `Intermediate AI 6-Week Cohort`

**Individual classes to remove from sale (Beginner, 4):**
- `Prompt Frameworks for Better Results`
- `AI as a Thinking Partner`
- `Chat / Projects / Cowork / Code(x)`
- `Hallucination, Pricing, and Privacy Basics`

**Individual classes to remove from sale (Intermediate, 6):**
- `Chat / Projects / Cowork / Code(x) (Intermediate)`
- `Quantitative Analysis with an LLM`
- `Building and Working with Agents`
- `Projects — When You Actually Want a Siloed Experience`
- `Data Privacy and Security`
- `When to Automate`

**Leaders track to remove entirely (4 individual + 1 cohort):**
- `AI Foundations for Market Research Leaders`
- `Practical AI`
- `Governance, Risk, and Tool Standardization`
- `Workflows — Let's Map and Decide (2-session sequence)` **and** its
  duplicate key `Workflows — Let's Map and Decide (2-part sequence)`
  (both exist in `catalog.js` for the same class — remove both)
- `AI for Market Research Team Leaders — 6-week Cohort`

---

## Phase 1 — Archive the individual-class JSON-LD out of `classes.html`

**Goal:** get the 10 individual-class `Course`/`Offer` objects out of the
live structured data (see exception 2 above — JSON can't be commented
in-place), while keeping a readable copy.

1. Create `content/classes-archive/individual-classes-jsonld-2026-07.html`.
2. At the top of that new file, add an HTML comment explaining what it is:
   ```html
   <!--
     Archived 2026-07-27. Cut from the JSON-LD in classes.html when the
     site moved to cohort-only sale (see CLAUDE.md decision log, 2026-07-27
     entry). JSON-LD can't hold in-place comments the way the page markup
     can, so these 10 individual-class Course/Offer objects were moved
     here verbatim instead of commented out. The class cards themselves
     are still in classes.html, just HTML-commented out (see Phase 2) —
     this file only holds the structured-data objects.
   -->
   ```
3. From `classes.html`, copy (don't yet delete) the 10
   `{ "@type": "Course", ... }` JSON-LD objects from the `@graph` array
   (the ones whose `"name"` matches one of the 10 individual class names
   listed above — 4 Beginner + 6 Intermediate) into the archive file,
   wrapped in their own `<script type="application/ld+json">...</script>`
   — it doesn't need to stay valid combined JSON-LD in the archive, it just
   needs to be preserved and readable.
4. **Verify:** open the archive file and confirm all 10 class names from
   the Beginner/Intermediate list above appear in it.

## Phase 2 — Trim `classes.html` down to cohort-only

Only do this after Phase 1's archive file is confirmed complete.

1. Delete the 10 individual-class `{ "@type": "Course", ... }` JSON-LD
   objects from the `@graph` array (remove each object and its trailing
   comma; do not touch the `WebPage` object or any objects after the last
   `Course` entry, e.g. `Organization`/`Person`/`FAQPage` nodes). Re-check
   the JSON is still valid (no dangling commas) — paste it into a JSON
   validator or `node -e "JSON.parse(require('fs').readFileSync('classes.html','utf8').match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/)[1])"` and confirm it doesn't throw.
2. In the `id="beginner"` section, wrap the 4 individual class cards in an
   HTML comment — one comment around the whole group is fine:
   ```html
   <!-- Individual Beginner classes — paused 2026-07-27, cohort-only for now. See CLAUDE.md decision log.
   ...the 4 class-card elements, unchanged...
   -->
   ```
   Leave the `.cohort-card` for `AI Beginners 4-Week Bundle (cohort)`
   outside the comment, rendering normally. Rewrite the section intro
   paragraph (currently mentions "$129 individually, or take all 4 in the
   Beginner cohort bundle for $395") to describe a cohort-only offering —
   state the 4 topics covered and the $395 price, drop the "$129
   individually" framing since that option no longer exists. Change the
   `section-label` from `Tier 1 · $129 / class` to something
   cohort-appropriate, e.g. `Tier 1 · Cohort Only`.
3. Do the same in the `id="intermediate"` section: wrap its 6 individual
   cards in one HTML comment (label it the same way, dated, pointing at the
   decision log), leave its `.cohort-card` (`Intermediate AI 6-Week
   Cohort`, $995) outside the comment. Update its intro paragraph and its
   `section-label` (`Tier 2 · $199 / class` → `Tier 2 · Cohort Only`) the
   same way.
4. Update page metadata to drop individual-class pricing:
   - `<meta name="description">` (currently mentions `$129/class` and
     `$199/class`)
   - `<meta property="og:description">`
   - `<meta name="twitter:description">`
   - the `"description"` field inside the JSON-LD `WebPage` object
   All four currently read something like "Beginner ($129/class, $395
   cohort) and Intermediate ($199/class, $995 cohort) tracks" — rewrite to
   "Beginner ($395 cohort) and Intermediate ($995 cohort) tracks."
5. Check the FAQ section (`id="faq"`) for any question/answer that assumes
   individual classes are purchasable on their own (e.g. anything implying
   you can buy a single class instead of the cohort) and update wording to
   reflect cohort-only registration. Leave FAQ items that already apply to
   both individual and cohort format unchanged if they still read correctly
   cohort-only (e.g. "cohorts need at least 5 enrolled to run" is fine as
   is).
6. **Verify:** load `classes.html` in a browser. Confirm the Beginner and
   Intermediate sections show only their cohort card each (no individual
   class cards), the page has no leftover "$129/class" or "$199/class"
   text anywhere, and the JSON-LD still parses.

## Phase 3 — Comment out Leaders links sitewide (files stay in place)

Do **not** edit `classes/leaders.html` or `class-checkout/leaders.html`
content in this phase — only comment out other files' links to them, in
place, so nothing renders but everything is still there in the source.

1. Wrap the `For Leaders` nav link (`<li><a href="/classes/leaders" ...>
   For Leaders</a></li>`, appears in both header nav and footer nav — two
   occurrences per file) in `<!-- -->` in every one of these files:
   - `index.html`
   - `about.html`
   - `contact.html`
   - `tools.html`
   - `classes.html`
   - `quiz.html`
   - `newsletter.html`
2. Comment out the other Leaders CTAs/mentions in the same files where
   present:
   - `index.html`: the `For Team Leaders` ghost-button CTA (appears twice,
     once in the hero area and once in a lower CTA section) and the
     `Register for Leaders Classes →` button in the "For Team Leaders"
     section. If commenting out the CTA leaves its surrounding section
     empty or purposeless (no other content), comment out the whole
     section rather than leaving a hollow one — but if any of the
     surrounding copy still reads fine pointing only at the two cohorts,
     keep that part live and only comment the Leaders-specific piece.
     **OWNER: confirm which of those two outcomes is right for this
     section before it goes live** — this is a marketing-copy judgment
     call, not a mechanical one.
   - `index.html` FAQ: the answer that currently says "Browse the full
     class catalog or the Leaders track, choose your classes..." — edit
     the visible sentence to drop the "or the Leaders track" clause (this
     is a copy edit, not a comment-out, since the rest of the sentence
     stays live).
   - `about.html`, `contact.html`, `tools.html`: comment out the `For Team
     Leaders` ghost-button CTA where present.
   - `classes.html`: comment out its `For Team Leaders` ghost-button CTA in
     the footer CTA section.
3. `class-checkout/success.html`: comment out the `<a href="leaders.html"
   class="secondary">For Leaders</a>` link.
4. `sitemap.xml`: wrap the `<url>` block containing
   `<loc>https://www.mrxplorer.com/classes/leaders</loc>` in an XML comment
   (`<!-- -->` — valid in XML too).
5. `llms.txt`: this is a plain-text/markdown discovery file for LLM
   crawlers, not a page a visitor browses, and it has no comment syntax of
   its own — delete the line `- [AI for Market Research Leaders]
   (https://www.mrxplorer.com/classes/leaders): governance, risk, workflow
   mapping, and a 90-day implementation plan for research leaders` outright
   rather than leaving stray `<!-- -->` markup in a text file meant to be
   read as prose. The removed line is preserved verbatim here and in git
   history if it's needed again.
6. **Verify:** `grep -rln "classes/leaders" . --include="*.html" --include="*.xml"`
   from the repo root — every file it lists (other than
   `classes/leaders.html` and `class-checkout/leaders.html` themselves)
   should have that link sitting inside an HTML/XML comment, not live
   markup. Open each in a browser or view-source and confirm the "For
   Leaders" link/CTA doesn't render anywhere outside the two Leaders pages
   themselves.

## Phase 4 — Prune the checkout catalog (this is what actually blocks sale)

**This is the safety-critical phase.** `class-checkout/netlify/functions/
create-checkout-session.js` looks up `CATALOG[item.name]` and rejects the
purchase with a 400 if the name isn't there (confirmed by reading the file
— see the `validatedItems` mapping around line 50). Removing catalog
entries is what actually stops a purchase from completing, independent of
whether a page still links anywhere.

1. In `class-checkout/netlify/functions/catalog.js`, this is JavaScript, so
   use `//` line comments rather than deleting — comment out the entries
   for all 10 individual Beginner/Intermediate classes and all 5 Leaders
   entries (4 individual + the cohort) in **both** the `CATALOG` object and
   the `SCHEDULES` object. Use the exact name list at the top of this plan
   — comment out both the `CATALOG` line and the matching `SCHEDULES` line
   for each name. Comment out both Workflows keys (`2-session sequence`
   and `2-part sequence`). Leave the 2 kept cohort entries live and
   uncommented in both objects. Add one `// Paused 2026-07-27 — see
   CLAUDE.md decision log. Not for sale, kept for restore.` comment above
   each commented block so it's clear later why these lines are inert.
   A commented-out object literal spanning multiple lines needs each line
   prefixed with `//` (JS has no multi-line comment-safe way to wrap an
   object literal that itself contains a `//` inside a string, and none of
   these entries do, so per-line `//` is safe and simplest).
2. **Verify:** after editing, the **live (uncommented)** entries in
   `CATALOG` and `SCHEDULES` in `catalog.js` should each be exactly 2:
   `AI Beginners 4-Week Bundle (cohort)` and `Intermediate AI 6-Week
   Cohort`. Run `node -e
   "import('./class-checkout/netlify/functions/catalog.js').then(m =>
   console.log(Object.keys(m.CATALOG)))"` from the repo root and confirm
   the printed array has exactly those 2 names — this only reflects live
   code, so it's a true test of what's actually still commented vs. live,
   not just a visual check.

## Phase 5 — Update the checkout UI (`class-checkout/index.html`)

1. Find the `TIERS` object (`const TIERS = { beginner: {...}, intermediate:
   {...} }`). For both `beginner.classes` and `intermediate.classes`
   (currently each an array of `{ name, desc }` objects), comment out each
   object inside the array with `//` (one `//` per line of the object
   literal) rather than deleting them, and leave the array itself as
   `classes: [],` with the commented objects sitting inside it, e.g.:
   ```js
   classes: [
       // Paused 2026-07-27 — see CLAUDE.md decision log. Not for sale, kept for restore.
       // { name: "Prompt Frameworks for Better Results", desc: "..." },
       // { name: "AI as a Thinking Partner", desc: "..." },
       // ...
   ],
   ```
   Do not touch `cohortName`, `cohortPrice`, or `cohortSchedule` on either
   tier — those still drive the working cohort-purchase buttons
   (`.cohort-register` elements), which are independent of `tier.classes`
   and must keep working.
2. This alone stops the individual-class checkboxes and their "buy
   individually" flow from rendering (the render loop iterates
   `tier.classes`, which is now empty) without touching the cohort
   purchase path. Confirm this by reading the `Object.entries(TIERS).forEach`
   render block and the `beginCohortCheckout` function — the cohort button
   click handler never reads `tier.classes`.
3. Visually inspect the page copy around each tier's now-empty class list
   container (search for `id="beginner-classes"` and
   `id="intermediate-classes"` in the surrounding HTML, not the `<script>`
   block) and remove/adjust any heading or instructional text that assumed
   individual classes would render there (e.g. "Choose your classes"
   headings, "$129 each" pricing captions). Keep the cohort card, its date
   picker (`cohort-date-options`), and its `Register` button untouched.
4. The "switch to cohort" upsell modal (`#cohort-modal`, triggered from
   `updateUI()` when all of a tier's individual classes are selected) can
   never trigger once `tier.classes` is empty (the `allInTier > 0` guard in
   `updateUI()` prevents it) — it's now dead but harmless. Leave it in
   place; do not spend time removing it unless doing a later cleanup pass.
5. `class-checkout/leaders.html`: no code change needed. Its own class/cohort
   names were removed from `catalog.js` in Phase 4, so any purchase attempt
   from that page fails server-side with "Invalid class selection." **OWNER:
   decide whether to leave it silently broken at the checkout step (lowest
   effort) or add a plain banner near the top saying registration is
   currently unavailable** (a few lines of static HTML, no JS logic
   change) — either is acceptable, this is a UX call, not a mechanical one.
6. **Verify:** open `class-checkout/index.html` in a browser. Confirm no
   individual class checkboxes render under either tier, both cohort cards
   still show a start-date picker and an enabled Register button, and
   clicking Register for either cohort reaches Stripe test checkout with
   the correct cohort name and price. Do this as an actual **LIVE** Stripe
   test-mode run, not just a visual check.

## Phase 6 — Update the schedule data and regenerate

1. In `data/schedule.json`:
   - Remove all 10 entries from the top-level `"classes"` array whose
     `"name"` matches an individual Beginner/Intermediate class from the
     list above. Remove all 4 individual Leaders entries and the Workflows
     sequence entry from the same array (this empties the `"classes"`
     array entirely, since it only ever held individual/sequence classes).
   - Remove the `AI for Market Research Team Leaders — 6-week Cohort`
     entry from the `"cohorts"` array. Leave the other 2 cohort entries
     untouched.
2. Run `node scripts/generate-schedule.mjs` from the repo root. This
   regenerates `data/generated-schedule.json`, rewrites
   `data/holiday-review.md`, and rewrites the embedded
   `GENERATED_SCHEDULE`/`GENERATED_COHORTS` blocks in both
   `class-checkout/index.html` and `class-checkout/leaders.html`. That's
   expected and fine — `class-checkout/leaders.html` still exists as a file
   (Phase 3 rule), it's just unlinked and unsellable; it's fine for its own
   embedded schedule data to still refresh.
3. **Verify:** `data/schedule.json`'s `"classes"` array should be `[]`.
   Its `"cohorts"` array should have exactly 2 entries. Open
   `data/holiday-review.md` and confirm it no longer lists any of the
   removed class/cohort names (the generator rewrites this file from
   scratch, so it should self-correct — check it did).

## Phase 7 — Full-site sweep for stragglers

1. Run this search from the repo root and review every hit — it's
   expected to be noisy now, since Phases 1-5 commented things out in
   place rather than deleting them, so "leaders" will still appear in a
   lot of files:
   ```
   grep -rn "129/class\|199/class\|\$129 individually\|\$199 individually" . --include="*.html"
   ```
   Every hit this returns is a straggler that Phase 2 missed — this text
   should not exist live anywhere (individually-priced classes aren't for
   sale, so no page should mention per-class pricing). Fix any hits found.
2. Run this second search and, for every hit, open the file and confirm
   the match is either (a) inside an HTML/JS comment produced by Phases
   1-5, or (b) inside one of the three known exceptions —
   `classes/leaders.html`, `class-checkout/leaders.html` (untouched by
   design), or `content/testimonials.json` (a testimonial quote uses the
   word "leaders" in an unrelated sense) or `.claude/settings.local.json`
   (unrelated permissions config):
   ```
   grep -rln "leaders" . --include="*.html" --include="*.json" --include="*.js" --include="*.xml" --include="*.txt" | grep -v node_modules
   ```
   Any hit that is neither commented-out nor one of those exceptions is a
   straggler that needs the same comment-out treatment as its phase above.
3. **Verify:** re-run both searches after fixing any stragglers. The first
   should return nothing. The second should return only the expected files,
   each confirmed clean by the check in step 2.

## Phase 8 — Close out

1. Update the **Status** line of the 2026-07-27 entry in `CLAUDE.md` and
   `AGENTS.md` from "Execution plan: see `classes-restructure-plan.md`" to
   a short note that the restructure shipped, with the date it went live.
   Keep both files identical.
2. **OWNER — LIVE:** Do a final walkthrough of the live (or preview) site:
   `classes.html` shows only two cohort products, no page links to
   `/classes/leaders` anywhere, and a real Stripe test-mode purchase
   succeeds for each of the two remaining cohorts. Do not consider this
   plan done until this walkthrough passes — every earlier "Verify" step is
   a local/mechanical check, this is the one that confirms it actually
   works end to end.
