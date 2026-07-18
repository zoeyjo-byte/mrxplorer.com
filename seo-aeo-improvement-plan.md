# MRXplorer SEO/AEO Improvement Plan

**Goal:** Make mrxplorer.com visible in search engines (SEO) and AI answer engines (AEO — ChatGPT, Claude, Perplexity, Google AI Overviews) for queries about AI training for market researchers and market research team leaders — and convert that traffic into class registrations.

**How to use this document:** Work through phases in order. Each task lists the files to touch, exactly what to do, and an acceptance check. Tasks marked **[OWNER INPUT]** need information or an action from Z and should be skipped (not guessed at) until that input exists. Everything else is implementable directly from this repo.

**Repo facts the implementer needs:**
- This repo IS the live site, served by GitHub Pages at `https://www.mrxplorer.com` (see `CNAME`).
- GitHub Pages serves `about.html` at both `/about` and `/about.html`. All internal links and canonicals must use the **extensionless** form (`/about`, `/tools`, etc.) to match the existing nav.
- The `class-checkout/` folder is a separate Netlify site deployed at `https://class-checkout.netlify.app` (Stripe checkout + serverless functions).
- Site-wide styles live in `style.css`; `tools.html` and `newsletter.html` currently carry their own inline `<style>` blocks (leave that alone — it works; do not refactor CSS in this plan).

---

## Current-state audit (why each phase exists)

### Critical problems

1. **Structured data is invisible to AI crawlers.** All JSON-LD is injected client-side by `schema.js` on `DOMContentLoaded` (`index.html:350-354`). GPTBot, ClaudeBot, PerplexityBot, and most AEO crawlers do **not** execute JavaScript, so the site's entire AEO layer — Person, Organization, Course, FAQ schema — is invisible to exactly the crawlers it was built for. It must be inlined as static `<script type="application/ld+json">` in each page's HTML.

2. **The commercial pages are off-domain.** "Classes" and "For Leaders" — the pages the whole site exists to sell — live at `class-checkout.netlify.app`, a bare checkout UI titled "AI Courses — Register" with no meta description, no schema, no nav back to the brand. Consequences: every internal "Classes" link leaks authority off-domain; mrxplorer.com has **no indexable page describing its own product in full**; anyone landing on the checkout from a shared link sees an unbranded Stripe form.

3. **No crawl infrastructure at all.** There is no `robots.txt`, no `sitemap.xml`, no `llms.txt`, and no canonical tags on any page. `favicon.ico` is referenced by two pages but doesn't exist (404s). There is no `404.html`.

4. **FAQ content exists only in schema, not on the page.** The FAQPage schema in `schema.js` (lines 193-228) has no corresponding visible content on the homepage. Google requires FAQ schema content to be visible on the page, and answer engines quote *visible text* — so this content currently helps nowhere and mildly risks a spam signal.

5. **No answer-shaped content.** The site has 5 thin pages and zero articles. AEO visibility comes from pages that directly answer the questions buyers ask ("how can market research teams use AI?", "what AI training exists for insights teams?"). The newsletters generate this content weekly but it all lives on beehiiv, earning mrxplorer.com nothing.

### Bugs and stale copy

6. `contact.html:8-17` has the **old homepage's** title and meta ("MRXplorer — AI Training for Market Research Teams" / "…using Claude. Training, not implementation.") instead of contact-page metadata.
7. `tools.html` and `newsletter.html` load no schema at all (no `schema.js`, no inline JSON-LD).
8. The `ORGANIZATION` description in `schema.js:58` still describes the old consulting positioning ("build, prompt, and manage AI workflows using Claude. Education and enablement — not implementation") rather than live classes. The `serviceType` list (`schema.js:63-68`) likewise says "Consulting."
9. Course schema is missing `hasCourseInstance` — **required** by Google for Course rich results — plus `courseMode`, `instructor`, and an `offers.url`.
10. Root contains duplicate badge images with spaces in filenames (`Greenbook 2025 Author 150px.png`, `Proud Member GSBA 150px.png`) alongside the underscore versions actually used. The space-named ones are unreferenced clutter.
11. No analytics and no search-console verification anywhere — the site currently cannot measure anything this plan improves.
12. No class dates/schedule appear anywhere on the site ("live virtual, Pacific time" only) — a conversion blocker and a missed `CourseInstance.startDate`.
13. The AI Tips signup form (`newsletter.html:564-568`) POSTs `first_name`/`email` to `https://ai-for-mrx.beehiiv.com/subscribe`. Beehiiv's supported patterns are their embed script/iframe or a GET to `/subscribe?email=`. This form likely fails silently. Needs verification.

---

## Phase 0 — Measurement (do first; mostly [OWNER INPUT])

These make every later change measurable. The code parts are trivial; the account setups need Z.

- **0.1 [OWNER INPUT]** Create a Google Search Console property for `mrxplorer.com` (domain property, DNS verification — Z controls DNS). Then submit the sitemap from task 1.2.
- **0.2 [OWNER INPUT]** Create a Bing Webmaster Tools property (imports from GSC in one click). Bing matters disproportionately here: its index feeds ChatGPT search.
- **0.3** Add lightweight analytics to every page, immediately before `</head>`. Recommend Plausible (`<script defer data-domain="mrxplorer.com" src="https://plausible.io/js/script.outbound-links.js"></script>`) or GA4 — **[OWNER INPUT]** for the account/choice; wire whichever snippet Z provides into all 5 pages + both checkout pages.
- **Acceptance:** GSC + Bing verified; sitemap submitted; analytics events visible from all pages.

---

## Phase 1 — Technical foundations (pure code; do in one PR)

### 1.1 `robots.txt` (new file, repo root)

The AEO goal means AI crawlers should be explicitly welcomed, not just tolerated:

```
User-agent: *
Allow: /

# AI answer-engine crawlers — explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Claude-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://www.mrxplorer.com/sitemap.xml
```

### 1.2 `sitemap.xml` (new file, repo root)

List every indexable page with extensionless URLs. Initial set: `/`, `/about`, `/tools`, `/contact`, `/newsletter`, plus `/classes` and `/classes/leaders` once Phase 2 creates them. Use `<lastmod>` with the date of the commit that adds/changes each page. **Every time a page is added or meaningfully edited in later phases, update this file in the same commit.**

### 1.3 `llms.txt` (new file, repo root)

Markdown file per the llms.txt convention — a concise map of the site for LLM crawlers:

```markdown
# MRXplorer

> MRXplorer teaches live virtual AI classes for market researchers, insights
> teams, and market research leaders. Taught by Z Johnson, a 20+ year market
> research veteran. Three tracks: Beginner ($79/class or $249 for all 4),
> Intermediate ($99/class or $499 for all 6), and Leaders ($499/session or
> $2,595 for all 5). Classes are 90 minutes, live, virtual, Pacific time.

## Classes
- [Class catalog](https://www.mrxplorer.com/classes): all beginner and intermediate classes with descriptions and pricing
- [AI for Market Research Leaders](https://www.mrxplorer.com/classes/leaders): governance, risk, workflow mapping, and a 90-day implementation plan for research leaders

## About
- [About Z Johnson](https://www.mrxplorer.com/about): instructor background — Microsoft research director, Ipsos, Course5, insights-tech leadership
- [Contact](https://www.mrxplorer.com/contact): booking and inquiries

## Resources
- [Free tools](https://www.mrxplorer.com/tools): Workflow Diagnostic — free automation-complexity assessment for research teams
- [Newsletters](https://www.mrxplorer.com/newsletter): MRXplorations (weekly AI news for MRX) and AI Tips for MRX (weekly practical tip)
```

(Until Phase 2 ships, point the two class links at the current checkout URLs; update in Phase 2.)

### 1.4 Canonical + missing head tags on every page

For each of the 5 pages, add inside `<head>`:

```html
<link rel="canonical" href="https://www.mrxplorer.com/PAGEPATH">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="(same as og:title)">
<meta name="twitter:description" content="(same as og:description)">
<meta name="twitter:image" content="https://www.mrxplorer.com/assets/mrxplorer-logo-social.png">
```

Canonical paths: `https://www.mrxplorer.com/` (home), `/about`, `/tools`, `/contact`, `/newsletter`. Also add `<link rel="icon" ...>` to `index.html`, `about.html`, `contact.html` (currently only tools/newsletter reference a favicon).

### 1.5 Favicon + 404 page

- Generate `favicon.ico` (and a `favicon.png` 32×32) from `assets/mrxplorer-logo.png` (crop to the logo mark; ImageMagick: `convert` the square mark to 16/32/48 ico). Place at repo root so the existing `/favicon.ico` references resolve.
- Create `404.html` using the same nav/footer as `about.html`, a short "Page not found" message, and links to `/`, `/classes`, `/newsletter`. GitHub Pages serves it automatically.

### 1.6 Fix `contact.html` metadata (bug)

Replace title/description/OG block (`contact.html:8-17`) with:

```html
<title>Contact MRXplorer — Ask About AI Classes for Research Teams</title>
<meta name="description" content="Contact Z Johnson at MRXplorer with questions about live AI classes for market researchers, team cohorts, or bringing AI training to your insights team.">
```

Mirror in `og:title`/`og:description`, and set `og:url` to `https://www.mrxplorer.com/contact`.

### 1.7 Inline the structured data statically (the single highest-impact AEO fix)

Replace runtime injection with static JSON-LD:

1. For each of `index.html`, `about.html`, `contact.html`: take the exact object `schema.js` builds for that page type (`home` / `about` / `contact`), serialize it, and paste it into the page `<head>` as `<script type="application/ld+json">{...}</script>`. The easiest correct method: open the current live page in a browser (or run the schema.js logic in Node with a small harness), copy the injected JSON, prettify, inline.
2. **While inlining, fix the content problems** (don't copy them verbatim):
   - `ORGANIZATION.description` → "MRXplorer LLC teaches live virtual AI classes for market research agencies, insights teams, and research leaders. Founded by Z Johnson, a 20+ year market research veteran."
   - `ORGANIZATION.serviceType` → `["AI Training for Market Researchers", "Live Virtual AI Classes", "AI Governance Training for Research Leaders"]`
   - Every `Course` object gains:
     ```json
     "courseMode": "Online",
     "hasCourseInstance": {
       "@type": "CourseInstance",
       "courseMode": "Online",
       "courseWorkload": "PT1H30M",
       "instructor": { "@id": "https://www.mrxplorer.com/#z-johnson" }
     },
     "offers": { "@type": "Offer", "price": <tier price>, "priceCurrency": "USD",
                 "availability": "https://schema.org/InStock",
                 "url": "https://www.mrxplorer.com/classes",
                 "category": "Paid" }
     ```
     (When class dates exist — task 3.2 — add `startDate`/`endDate` to each CourseInstance.)
   - Remove the `WEBSITE.potentialAction` SearchAction (`schema.js:90-97`) — the site has no search endpoint; the template is a lie to crawlers.
   - The FAQPage schema moves to the homepage inline block **only after** task 3.1 makes the FAQ visible; until then omit it from the inline JSON-LD.
   - Contact page: drop the "Bring your workflow diagnostic results" phrasing in `schema.js:287` — say "Email Z Johnson with questions about classes, team cohorts, or AI training for your research organization."
3. Add appropriate inline JSON-LD to the two pages that have none:
   - `tools.html`: WebPage + BreadcrumbList + a `SoftwareApplication` or `WebApplication` entity for the Workflow Diagnostic (name, description, `applicationCategory: "BusinessApplication"`, `offers` price 0, `url` of the diagnostic).
   - `newsletter.html`: WebPage + BreadcrumbList + two `Newsletter`-typed entities (use `"@type": ["CreativeWorkSeries", "Periodical"]`, name, description, `publisher` → org `@id`, `url` → beehiiv links).
4. Delete the `<script src="schema.js">` + `injectSchema(...)` calls from all pages, then delete `schema.js` (its data now lives in the pages; keeping both guarantees drift).

**Acceptance for 1.7:** `curl -s https://www.mrxplorer.com/ | grep -c 'application/ld+json'` ≥ 1 for every page (i.e., schema present in raw HTML with JS disabled); each page passes https://validator.schema.org and Google's Rich Results Test with zero errors.

### 1.8 Housekeeping

- Delete the two space-named duplicate images at root (`Greenbook 2025 Author 150px.png`, `Proud Member GSBA 150px.png`) after grepping to confirm nothing references them.
- Add `width`/`height` + descriptive `alt` to the About headshot (`about.html:69` — alt should be "Z Johnson, founder of MRXplorer" not just "Z Johnson").

---

## Phase 2 — Bring the Classes onto mrxplorer.com (biggest SEO + conversion win)

**Principle:** marketing/description pages live on mrxplorer.com and get indexed; the Netlify site remains only the checkout mechanism and gets noindexed.

### 2.1 Create `/classes` (new `classes.html` at repo root)

A full catalog page using the shared `style.css`, same nav/footer as `index.html`, containing:

- H1: "Live AI Classes for Market Researchers" (this page owns the money keyword; retitle the homepage H1 focus if needed — homepage keeps its current brand-y H1, this page is the descriptive one).
- Title tag: `AI Classes for Market Researchers — Beginner & Intermediate | MRXplorer`
- Meta description: ~155 chars covering tracks + prices + live/virtual format.
- The Beginner and Intermediate tiers with **every class as its own subsection**: an `<h3>` per class, the existing description expanded to 2–3 sentences ("who it's for / what you'll walk away with" — source copy from `index.html:133-195` and `class-checkout/index.html`), price, duration, format.
- A visible per-page FAQ (5–6 questions): "Do I need AI experience?", "What tools do the classes use?", "Are sessions recorded?" **[OWNER INPUT for the answers to recording/refund/schedule questions]**, "Can my whole team attend?", "What time zone are classes in?" — with matching FAQPage JSON-LD inline.
- CTA buttons → `https://class-checkout.netlify.app/` (unchanged checkout).
- Inline JSON-LD: WebPage + Breadcrumb + the full Course list for beginner/intermediate (moved from the homepage block — the homepage keeps Organization/Person/Website + a *reference* to the classes page; the Course entities' canonical home becomes this page. Avoid duplicating full Course objects on both pages).

### 2.2 Create `/classes/leaders` (new `classes/leaders.html`)

Same treatment for the Leaders track. Title: `AI Training for Market Research Leaders — Governance & 90-Day Plan | MRXplorer`. This page targets the "market research team leaders" audience from the site goal directly: expand each of the 5 sessions into a paragraph, state the outcomes (governance rules, tool standardization decision, 90-day implementation plan), pricing, cohort structure. Leaders-specific FAQ (procurement, invoicing, team pricing — **[OWNER INPUT]** for answers). CTA → `https://class-checkout.netlify.app/leaders.html`.

### 2.3 Repoint every internal link

In all 5 existing pages (nav + footer + hero + CTA strips), change:
- `https://class-checkout.netlify.app/` → `/classes`
- `https://class-checkout.netlify.app/leaders.html` → `/classes/leaders`

The **only** remaining links to the Netlify URLs are the "Register/Checkout" buttons on the two new class pages. Update `sitemap.xml` and `llms.txt` accordingly.

### 2.4 Noindex + brand the checkout site (`class-checkout/`)

- Add to `<head>` of `class-checkout/index.html`, `leaders.html`, `success.html`: `<meta name="robots" content="noindex">` (they must not compete with the new on-domain pages).
- Add real titles ("Register — MRXplorer AI Classes"), a meta description, the MRXplorer logo linking back to `https://www.mrxplorer.com/classes`, and a "← Back to class details" link. Do **not** touch any Stripe/checkout JavaScript or the Netlify functions.

**Acceptance:** `site:mrxplorer.com` eventually shows /classes pages; no nav/footer link on mrxplorer.com points at netlify.app; checkout flow still completes (test a Stripe checkout session opens from both new pages' buttons).

---

## Phase 3 — AEO content (visible answers, proof, and freshness)

### 3.1 Visible FAQ on the homepage

Add a "Common questions" section to `index.html` (before the CTA strip) rendering the 4 existing FAQ Q&As from `schema.js:193-228` as visible `<h3>`/`<p>` content (or `<details>` elements), updating the "How do I register" answer to reference the /classes pages. Re-add the FAQPage JSON-LD to the homepage inline schema **only once this section exists**. Answer text in schema must match page text.

### 3.2 [OWNER INPUT] Publish the class schedule

Get actual upcoming dates from Z. Add a "Upcoming sessions" block to `/classes` and `/classes/leaders`, and `startDate` (ISO 8601 with `-07:00`/`-08:00` offset) to each `CourseInstance`. If dates truly don't exist yet, add "Next cohort: <season> 2026 — join the newsletter to be notified" — a page selling live classes with no dates loses both conversions and CourseInstance eligibility.

### 3.3 [OWNER INPUT] Social proof

Collect 3–5 testimonials/results from past students or consulting clients. Add a testimonial section to `/classes`, `/classes/leaders`, and the homepage. Mark up with `Review`/`aggregateRating` schema only if they are genuine, attributable quotes.

### 3.4 Build an articles section (`/articles/`) seeded from newsletter content

This is the engine for AEO visibility; everything above is plumbing.

- Create `articles/index.html` (listing page) and an article template (shared nav/footer/`style.css`, `Article` JSON-LD with `author` → Z's Person `@id`, `datePublished`, breadcrumbs, canonical).
- Seed with 5 launch articles targeting the queries buyers actually ask. Suggested titles (each maps to a query cluster; write 800–1,200 words each, answer the question in the first 2 sentences, use question-form H2s):
  1. "How Market Researchers Are Actually Using AI in 2026" — head-term query.
  2. "AI Training for Market Research Teams: What to Look For (and What to Skip)" — commercial-intent, links to /classes.
  3. "What Data Should Market Researchers Never Put Into an AI Tool?" — pulls from the Data Privacy class; strong AEO snippet bait.
  4. "How to Write an AI Acceptable-Use Policy for a Market Research Team" — leaders query, links to /classes/leaders.
  5. "Prompt Frameworks for Market Research: A Starter Guide" — pulls from the beginner class; include one real copy-paste prompt like the newsletter sample (`newsletter.html:605-619`).
- **[OWNER INPUT]** Z reviews/edits every article before publish — the voice and the experience claims must be hers (E-E-A-T is the point; generic AI copy defeats it).
- Ongoing cadence: each week, adapt one AI Tips for MRX issue into a short on-site article (the tip content already exists; the newsletter links to the article, the article links to the newsletter signup — both properties reinforce each other instead of beehiiv keeping all the content equity).
- Add `/articles/` + each article to `sitemap.xml` and an "Articles" link to nav/footer on all pages; add the section to `llms.txt`.

### 3.5 Fix/verify the AI Tips signup form

Test the form at `newsletter.html:564-568`. If the POST to `https://ai-for-mrx.beehiiv.com/subscribe` doesn't create a subscriber, replace with beehiiv's official embed for that publication (**[OWNER INPUT]**: grab the embed snippet from the beehiiv dashboard) or link out like the MRXplorations card does. A silently broken email-capture form is the most expensive bug on the site.

---

## Phase 4 — Ongoing (recurring checklist, not one-time)

1. Weekly: one newsletter-derived article published (3.4 cadence); sitemap updated.
2. Monthly: check GSC — which queries show impressions; write/expand pages for question queries with impressions but no clicks.
3. Monthly: run 3–5 target prompts through ChatGPT/Claude/Perplexity ("best AI training for market researchers", "AI classes for insights teams", "AI governance training market research") and record whether MRXplorer is cited; adjust article targets toward gaps.
4. Each new class/tier/price change: update page copy, inline JSON-LD, `llms.txt`, and sitemap in the same commit (grep for the old price across the repo — prices currently live in at least 4 places).
5. Keep dates fresh: expired `CourseInstance.startDate`s must be rolled forward or removed.

---

## Guardrails for the implementing model

- **Do not** redesign, restyle, or refactor CSS. Match existing visual patterns exactly (copy nav/footer markup from `index.html`; new pages use `style.css` classes that already exist).
- **Do not** touch `class-checkout/netlify/functions/*`, Stripe keys, price logic, or `main.js`.
- **Do not** change prices, class names, or class descriptions beyond expanding them; never invent testimonials, dates, credentials, or student counts — those are [OWNER INPUT].
- **Do not** add cookie banners, popups, or third-party scripts beyond the one analytics snippet Z chooses.
- Preserve the extensionless-URL convention everywhere (`/classes`, not `/classes.html`).
- After every phase: validate changed pages at validator.schema.org, check all internal links resolve, and view each page at 375px width.

## Definition of done (whole plan)

- [ ] Raw HTML of every page (curl, no JS) contains its full, valid JSON-LD.
- [ ] `robots.txt`, `sitemap.xml`, `llms.txt`, `favicon.ico`, `404.html` all live and correct.
- [ ] Every page has a unique, accurate title, meta description, canonical, OG + Twitter tags.
- [ ] `/classes` and `/classes/leaders` exist on-domain, fully describe the product, and are the only pages linking out to the Netlify checkout (which is noindexed and branded).
- [ ] Homepage FAQ is visible text with matching schema.
- [ ] Articles section exists with ≥5 published, owner-reviewed articles and a weekly pipeline from the newsletter.
- [ ] GSC + Bing verified, sitemap submitted, analytics on every page.
- [ ] Class schedule (or explicit next-cohort note) visible; email capture verified working.
