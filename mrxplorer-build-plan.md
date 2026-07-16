# MRXplorer AI Classes — Build Plan

## Context

MRXplorer is pivoting from AI-implementation consulting to teaching live virtual AI
classes for market researchers. The site lives in one GitHub repo, deployed via
Netlify, at:

**Repo:** https://github.com/zoeyjo-byte/mrxplorer.com
**Live checkout:** https://class-checkout.netlify.app/
**Production domain (target):** https://www.mrxplorer.com (currently on Google
Sites — to be retired once this build is live)

### Current repo structure

```
/
├── index.html          ← marketing site homepage (OLD consulting-model copy, needs rewrite)
├── about.html           ← marketing site about page
├── contact.html         ← marketing site contact page
├── main.js
├── schema.js             ← injects JSON-LD structured data per page (injectSchema('home') etc.)
├── style.css             ← branded site styles (Playfair Display / Alegreya Sans)
└── class-checkout/
    ├── index.html         ← Beginner + Intermediate checkout (functional/Stripe-purple style)
    ├── leaders.html       ← Leaders checkout (same functional style, has cohort-upsell modal)
    ├── success.html       ← post-payment landing page (currently static, no logic)
    ├── netlify.toml
    ├── package.json
    ├── MRXplorerLogo.svg
    └── netlify/functions/
        ├── create-checkout-session.js   ← current Stripe integration
        └── package.json
```

**Important distinction:** the root site (`index.html`, `about.html`, etc.) is the
branded marketing site. `class-checkout/index.html` and `class-checkout/leaders.html`
are functional checkout pages (plain system fonts, Stripe-purple `#635bff` styling,
checkbox class lists). Do not blend these visual styles — the checkout pages are
intentionally utilitarian.

### Current `create-checkout-session.js` (baseline to modify, not replace)

```js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const { items } = JSON.parse(event.body);
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `https://${event.headers.host}/success.html`,
      cancel_url: `https://${event.headers.host}/`,
    });
    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
```

Known gaps in this file: no date field on line items, no tax settings, no capacity
check, no webhook for post-payment logic.

---

## Business rules (confirmed, do not re-derive)

- **Capacity:** individual class sessions cap at 12 registrants. Cohort sessions cap
  at 9 registrants.
- **Cohort minimum:** cohorts need 5+ signed up to run (mirrors Z's existing ICN
  class minimum). If fewer than 5 are signed up 5 days before a cohort start date,
  Z manually contacts registrants to offer (a) wait for next cohort or (b) switch to
  individual classes at the cohort discount rate. **This is a manual process — do
  not build automated cancellation/refund logic for this.**
- **Cohort cadence:** cohorts teach the *same* content as the individual classes,
  just at a different day/time (see schedule table below), run twice a month
  effectively (once as individual sessions, once as cohort sessions).
- **Tax:** Washington live virtual classes became taxable retail sales as of
  October 1, 2025 (WA ESSB 5814). Z is tax-registered in WA. Stripe Tax must be
  enabled.
  - Tax code (confirmed via Stripe's own picker): `txcd_20060045`
  - **Open decision, needs Z's input before finalizing:** tax_behavior —
    tax-inclusive pricing (displayed price includes tax) vs. tax-exclusive (tax
    added at checkout, shown separately). Default to `exclusive` unless told
    otherwise, but confirm with Z before shipping.
- **Email sender:** confirmation emails will come via Resend, likely from a
  subdomain (e.g. `updates.mrxplorer.com` or `mail.mrxplorer.com`) rather than the
  bare `zjohnson@mrxplorer.com`, to avoid touching existing Google Workspace
  MX/SPF records. **Confirm the exact subdomain and verify Resend domain status
  before wiring up the webhook email step** — this is a prerequisite, not
  something to build around.

---

## Class catalog + schedule (source of truth)

All classes are 90 minutes, live virtual, Pacific time. "Nth [Weekday]" means the
Nth occurrence of that weekday in the month.

### Beginner — $79/class, cohort (all 4) $249

| Class | Date | Time |
|---|---|---|
| Prompt Frameworks for Better Results | 1st Tuesday | 12pm Pacific |
| AI as a Thinking Partner | 2nd Tuesday | 12pm Pacific |
| Chat / Projects / Cowork / Code(x) | 3rd Tuesday | 12pm Pacific |
| Hallucination, Pricing, and Privacy Basics | 4th Tuesday | 12pm Pacific |
| **AI Beginners 4-week Bundle (cohort)** | starts 2nd Tuesday, every 2 months | 9am Pacific |

Descriptions (from existing checkout copy):
- **Prompt Frameworks for Better Results** — Learn how to set up prompts that get you good results, and then how to make the results even better.
- **AI as a Thinking Partner** — Walk through ways to prompt AI to avoid the sycophantic, "What a great idea!" responses. Turn the AI into a tool that pushes on your thinking.
- **Chat / Projects / Cowork / Code(x)** — Learn what each of these tools are within Claude and ChatGPT and when to use each.
- **Hallucination, Pricing, and Privacy Basics** — A realistic look at AI's capabilities, privacy best practices, and why everyone talks about the price of tokens.

### Intermediate — $99/class, cohort (all 6) $499

| Class | Date | Time |
|---|---|---|
| Chat / Projects / Cowork / Code(x) (Intermediate) | 2nd Monday | 12pm Pacific |
| Data Privacy and Security | 2nd Monday | 9am Pacific |
| When to Automate | 3rd Monday | 12pm Pacific |
| Projects — When You Actually Want a Siloed Experience | 4th Monday | 12pm Pacific |
| Building and Working with Agents | 2nd Thursday | 12pm Pacific |
| Quantitative Analysis with an LLM | 4th Thursday | 12pm Pacific |
| **Intermediate AI 6-week Cohort** | starts 2nd Thursday, every 2 months | 9am Pacific |

Descriptions (from existing checkout copy):
- **Chat / Projects / Cowork / Code(x)** — Learn when to use each, and then build your first mini-app to help you with a traditional market research workflow.
- **Quantitative Analysis with an LLM** — LLMs used to have troubles counting, but they are more sophisticated now and most will call on relevant Python scripts to analyze data. Learn use cases for quant research and realistic limits to what they can do now.
- **Building and Working with Agents** — Turn your AI into a more efficient tool, and turn those repeated prompts into time-saving automations. Learn the difference between a "skill" and an "agent," and build one of each.
- **Projects — When You Actually Want a Siloed Experience** — Claude and ChatGPT both have the ability to use projects. Learn what they are, how to use them to support brand-side projects or agency-side client work. Learn what files to add, which to leave behind, and how these projects can save you time.
- **Data Privacy and Security** — What plans allow you to put what data into the AI? What data should you never put into an AI? What settings should you have in place? Review some best practices no matter what subscription you have.
- **When to Automate** — Learn how to evaluate your own routines and what to consider when deciding what to automate. Work through often-overlooked considerations that impact complexity.

### Leaders (AI for Market Research Leaders)

| Class | Date | Time |
|---|---|---|
| AI Foundations for Market Research Leaders | 1st Wednesday | 12pm Pacific |
| Practical AI | 1st Thursday | 12pm Pacific |
| Governance, Risk, and Tool Standardization | 2nd Friday | 12pm Pacific |
| Workflows — Let's Map and Decide (2-part) | 3rd & 4th Friday | 12pm Pacific |
| **AI for Market Research Team Leaders — 6-week Cohort** (includes 90-day implementation) | starts 1st Friday, every 2 months | 9am Pacific |

Note: pricing for Leaders individual/cohort classes was not confirmed in this
conversation — check with Z or pull current pricing from `leaders.html` before
building, do not assume parity with Intermediate pricing.

---

## Build phases

### Phase 1 — Content pivot (marketing site)
- Rewrite `index.html` hero + body copy: replace "Workflow Diagnostic / Training
  Consultation / AI Insights Residency" positioning with class-based training
  positioning ("AI classes for market researchers").
- Add tier-explainer section/page: help visitors self-identify Beginner vs.
  Intermediate vs. Leaders.
- Add full class catalog content to the marketing site (not just buried in
  checkout) using the descriptions above — this is for SEO, since checkout pages
  are functional and shouldn't be the only place this copy lives.
- Update `schema.js` with Course-type JSON-LD per class for AEO.
- Update `about.html` if it still references the old consulting model.
- Update nav/footer links to route into the three checkout pages.

### Phase 2 — Date data model
- Add a `sessionDate` (or `sessionId`) field to each class object in
  `class-checkout/index.html` and `leaders.html`, using the schedule table above.
- Individual classes: fixed single date per billing cycle (no picker needed since
  dates are fixed, not rolling — confirm whether the site should show the *next*
  upcoming occurrence dynamically, or a static date per class. **Open question for
  Z.**
- Cohort sessions: locked as a set, no date picker, just cohort start date shown.

### Phase 3 — Capacity tracking
- Use Netlify Blobs (or equivalent lightweight KV store already available on
  Netlify — avoid introducing a new external service).
- Before `create-checkout-session.js` creates a session, look up current
  registrant count for that class+date combination.
- Reject (return an error the frontend can show) if at cap (12 individual / 9
  cohort).
- Increment count on successful payment (via webhook, see Phase 5), not at
  session creation, since not all sessions convert to payment.

### Phase 4 — Stripe Tax
- Add to `create-checkout-session.js`:
  ```js
  automatic_tax: { enabled: true },
  ```
- Add to each line item:
  ```js
  tax_code: 'txcd_20060045',
  ```
- Confirm `tax_behavior` (inclusive/exclusive) with Z before finalizing — see
  Business Rules above.
- No DNS/dashboard work needed here — Z has confirmed WA tax registration is
  already active in Stripe.

### Phase 5 — Webhook + confirmation + calendar file
**Prerequisite: confirm Resend domain verification is complete before building
this phase.**
- New Netlify function listening for Stripe's `checkout.session.completed`
  webhook event.
- On successful payment:
  1. Increment capacity count for the purchased class+date (see Phase 3).
  2. Generate a `.ics` calendar file per class purchased (static generation is
     fine since dates are fixed — no calendar API integration needed).
  3. Send confirmation email via Resend, from the verified subdomain, with the
     `.ics` file(s) attached or linked.
  4. Update `success.html` to reflect the actual purchase (currently static)
     — show what was bought and next steps, ideally including
     "add to calendar" buttons in addition to the emailed `.ics`.

### Phase 6 — Retirement
- Once Phases 1–5 are live and tested, point the `mrxplorer.com` domain fully at
  the Netlify deploy.
- Retire the Google Sites site.

---

## Decisions (confirmed by Z, recorded)

| # | Question | Decision |
|---|----------|----------|
| 1 | Tax pricing display | **Exclusive** — tax added at checkout, not baked into displayed price |
| 2 | Resend sending subdomain | **`updates.mrxplorer.com`** — DNS verification complete ✅ |
| 3 | Individual class dates | **Dynamic** — show the next 2 occurrences per class; user picks which date to register for |
| 4 | Leaders tier pricing | **$499/class** individual, **$2,595** cohort (updated from old $299/$1,599) |
