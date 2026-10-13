# Coaching website launch

The root `index.html` is the production coaching homepage. It uses `coaching.css`, `assets/mrxplorer-logo-purple.png`, `assets/z-johnson-headshot.png`, and `assets/lgbtbe-blue-rainbow-transparent.png`. Upload/commit the changes with their existing directory paths. No new build tools are needed.

## GitHub Pages

Commit the prepared changes and push them to the branch used by GitHub Pages. Retain the existing CNAME. `_config.yml` excludes the historical archive, checkout app, and local mockups from the Jekyll site. If using a custom direct-upload Pages workflow, explicitly exclude those directories there too.

The homepage includes the $1,500 USD monthly offer, initial three-month engagement, weekly private hour, both newsletters, credentials, certification, and email inquiry link. About, contact, newsletters, tools, and article navigation now lead to coaching. `/classes.html` and `/quiz.html` redirect to `/#start` with a fallback link. Their full original sources are preserved in `_archive/cohorts-2026-10-12/`.

## Separate Netlify checkout deployment

Deploy `class-checkout/` through its existing Netlify project as well. Its homepage redirects to the main coaching site, and both cohort entries in `netlify/functions/catalog.js` are commented out so server-side checkout rejects them. Updating GitHub Pages alone does not update that separate live app unless its existing deployment integration also watches this repository.

The schedule source has no active classes or cohorts. Generated schedules were refreshed with the existing generator. Previous schedule JSON is preserved in the archive.

## Before announcing

- Open the homepage on desktop and mobile, test newsletter links and email inquiry.
- Confirm old class/quiz links resolve to coaching and the Netlify checkout no longer accepts cohort purchases.
- Coaching currently starts through an email conversation; no coaching subscription payment flow or scheduler has been added.
- Agree on holidays, fifth weeks, rescheduling, cancellation, and the limit for between-session questions in the client agreement.

The `experiments/coaching/` directory remains the review mockup; it is not the production entry point. No files have been committed, pushed, or deployed by this preparation.
