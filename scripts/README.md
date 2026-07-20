# Site Generators

Run these commands from the repository root after changing source content or schedule data:

```sh
node scripts/generate-articles.mjs
node scripts/generate-schedule.mjs
```

`generate-articles.mjs` reads `content/articles/*.md` and writes the published pages under `articles/<slug>/index.html`.

`generate-schedule.mjs` reads `data/schedule.json` and `data/schedule-overrides.json`, updates the marketing pages and checkout date data, and writes:

- `data/generated-schedule.json`
- `data/holiday-review.md`

When a holiday occurrence is approved for a different date, add it to `data/schedule-overrides.json` using the candidate date as the key:

```json
{
  "When to Automate": {
    "2027-01-18": "2027-01-25"
  }
}
```

Then rerun the schedule generator. The report deliberately flags dates on or within one day of an observed US holiday; it does not shift them automatically.
