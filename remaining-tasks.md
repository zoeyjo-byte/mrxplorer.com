# Remaining MRXplorer Tasks

This is the review queue after the July 2026 article, testimonial, checkout, waitlist, and schedule work. Items requiring an owner decision are marked **OWNER**. Items requiring access to a live service are marked **LIVE**.

## Schedule

- [ ] **OWNER** Review all 23 entries in `data/holiday-review.md` and decide whether each class occurrence stays on its recurring date or receives an alternate date.
- [ ] **OWNER** Add approved holiday changes to `data/schedule-overrides.json` and rerun `node scripts/generate-schedule.mjs`.
- [ ] **OWNER** Confirm the complete multi-week date sequence for each cohort, especially the Intermediate and Leaders cohorts, before generating multiple cohort calendar attachments.
- [ ] Confirm the weekly GitHub Action runs successfully on `main` and that GitHub Pages and the Netlify checkout deploy the generated schedule files.
- [ ] Verify that expired `CourseInstance.startDate` values are rolled forward or removed after each schedule refresh.

## Checkout And Capacity

- [ ] **LIVE** Run a Stripe test-mode purchase for one individual class and verify price, tax, company metadata, capacity increment, confirmation email, and calendar attachment.
- [ ] **LIVE** Run a Stripe test-mode purchase for a two-part Leaders workflow and verify both dates, both capacity keys, both calendar attachments, and the confirmation display.
- [ ] **LIVE** Run a Stripe test-mode cohort purchase and verify the cohort cap, start date, tax, company metadata, confirmation email, and calendar behavior.
- [ ] **LIVE** Deliver duplicate `checkout.session.completed`, `charge.refunded`, and `checkout.session.expired` events and verify idempotent capacity and waitlist behavior.
- [ ] Replace the remaining check-then-write capacity race with an atomic reservation mechanism or explicitly accept and monitor the low-volume oversell risk.
- [ ] Add reservation expiry handling if pending checkout sessions are allowed to hold seats before payment.
- [ ] **LIVE** Test a refund more than 72 hours before a session and verify automatic promotion of the next waiting entry.
- [ ] **LIVE** Test a refund inside the 72-hour window and verify no automatic promotion plus the notification to Z.
- [ ] **LIVE** Test an unpaid 24-hour waitlist promotion and verify `checkout.session.expired` advances to the next waiting entry.
- [ ] Decide whether `/api/capacity` should expose exact registration counts publicly or return only availability status for each requested session.

## Email And Forms

- [ ] **LIVE** Verify Resend delivery from `updates.mrxplorer.com` for confirmations, refund notices, team inquiries, and waitlist promotions.
- [ ] **LIVE** Submit the AI Tips Beehiiv form with a unique test address and verify the subscriber reaches the intended Beehiiv publication.
- [ ] Add rate limiting or abuse protection to the public waitlist and team inquiry endpoints before promoting them broadly.
- [ ] Decide whether duplicate waitlist submissions for the same email and session should be rejected or merged.

## Content And SEO/AEO

- [ ] **LIVE** Confirm Google Search Console and Bing Webmaster Tools verification, sitemap submission, and production indexing for all five article URLs.
- [ ] **LIVE** Validate production JSON-LD with Schema.org and Google's Rich Results Test after deployment.
- [ ] Remove or move `articles/template.html` outside the public site once the article-generation workflow is established.
- [ ] Publish one newsletter-derived article each week and rerun the article generator, sitemap update, and production validation.
- [ ] Review GSC monthly for question queries with impressions but no clicks, then expand the relevant article or class page.
- [ ] Run the target prompts from SEO/AEO Phase 4 through ChatGPT, Claude, and Perplexity monthly and record whether MRXplorer is cited.
- [ ] Update `llms.txt`, page copy, JSON-LD, and sitemap together for every future class, tier, schedule, or pricing change.

## Policy Decisions

- [ ] **OWNER** Confirm whether the 72-hour refund window is also the desired waitlist-promotion threshold.
- [ ] **OWNER** Decide whether future Leaders cohorts need an NDA or private-cohort option in addition to manual company screening and synthetic workflows.
- [ ] **OWNER** Confirm whether the supplied testimonials should ever be treated as class/student reviews. They are currently visible only and do not use `Review` or `aggregateRating` schema.
